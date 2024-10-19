


let globalMinYear, globalMaxYear, globalMaxY = 0;

// Load and analyze both men's and women's data simultaneously
Promise.all([
    d3.json('data/data_women.json'),
    d3.json('data/data_men.json')
]).then(function([dataWomen, dataMen]) {
    analyseData(dataWomen, "women");
    analyseData(dataMen, "men");
}).catch(function(error) {
    console.error('Error loading the JSON data:', error);
});

let sitter_count, datum, current_usable_object, people_data = [], realm_data, role_data;
function analyseData(data, datasetType) {
    // going through each portrait
    for (let i = 0; i < data.length; i++) {
        datum = data[i];
        //going through each sitter in an individual datum
        for (let j = 0; j < datum.sitter.length; j++) {
            sitter_count= d3.rollup(
                datum.sitter,
                v => v.length,
                d => d.substring(0, datum.sitter[j].indexOf(':')));
             
            if(sitter_count.size==1){
                //this is checking for portraits that have only one sitter to ensure that its indivuual portraits and not group
                //its adding it until it finds a different name. it should add it if it only has one name
            let name = datum.sitter[j].substring(0, datum.sitter[j].indexOf(':'))
            let realm = datum.sitter[j].substring(datum.sitter[j].indexOf(':') + 2, datum.sitter[j].indexOf('\\'));
            let role = datum.sitter[j].substring(datum.sitter[j].lastIndexOf('\\') + 1, datum.sitter[j].length);
                //we only want it if it has a date
            if(datum.date){ 
            current_usable_object = 
            {
                "name": name,
                "realm": realm,
                "role": role,
                "id": datum.id,
                "date": datum.date
            }
            people_data.push(current_usable_object);
            };

        }
            
    } 
} 
console.log(people_data)    
       
    // Get the hierarchical data for the treemap
    let hierarchyData = mapData(people_data);

    // Create the treemap using the hierarchical data
    createTreemap(hierarchyData, datasetType);
 }

 function mapData(data) {
    let realm_data = new Map();  // Initialize the Map to store realm counts

    // Iterate through each datapoint
    for (let i = 0; i < data.length; i++) {
        let realm = data[i].realm;  // Extract the realm from the data object
        let name = data[i].name;     // Extract the name from the data object
        let role = data[i].role;     // Extract the role from the data object

        // Update the count for the current realm in the realm_data Map
        if (!realm_data.has(realm)) {
            realm_data.set(realm, { count: 0, roles: {} });  // Initialize with count and roles
        }
        let realmInfo = realm_data.get(realm);
        realmInfo.count += 1;  // Increment count for the realm
        
        // Update roles count for this realm
        if (realmInfo.roles[role]) {
            realmInfo.roles[role] += 1;  // Increment count for the role
        } else {
            realmInfo.roles[role] = 1;    // Initialize with count = 1
        }
        realm_data.set(realm, realmInfo);
    }

    // Convert the realm_data Map into a hierarchical structure for the treemap
    let hierarchyData = {
        name: "Root",
        children: Array.from(realm_data).map(([realm, realmInfo]) => ({
            name: realm,      // Name of the realm
            count: realmInfo.count,  // Count of individuals in that realm
            roles: realmInfo.roles,  // Keep the roles for later use
        }))
    };

    console.log(hierarchyData);
    return hierarchyData;
}


const colorScale = d3.scaleOrdinal()
    .domain(["men", "women"])
    .range(["#D0FC83", "#D49EFF"]);

function createTreemap(data, datasetType) {
    const width = 600;  // Width of the treemap for each dataset
    const height = 600; // Height of the treemap for each dataset

    // Create the root of the hierarchy from the data, summing only at the realm level
    const root = d3.hierarchy(data)
        .eachBefore(d => {
            // Set 'count' at each realm level by summing its children's counts
            if (d.children) {
                d.value = d.children.reduce((acc, child) => acc + child.count, 0);
            }
        })
        .sum(d => d.count)  // Sum the 'count' value only for realms
        .sort((a, b) => b.value - a.value);  // Sort the realms based on their counts

    // Set up the treemap layout with the size and padding options
    d3.treemap()
        .size([width, height])  // Set the dimensions of the treemap
        .padding(2)  // Add some padding between the nodes
        .round(true) // Ensure that the rectangles have integer coordinates (removes gaps)
        (root);  

    // Create the SVG element where the treemap will be drawn
    const svg = d3.select(`#${datasetType}-treemap`)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Draw the rectangles for each realm node
    const cell = svg.selectAll("g")
        .data(root.leaves())  // Using 'leaves' ensures we only display leaf nodes (realms in this case)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`)  // Positioning each cell based on layout

    // Add rectangles to represent each realm
    cell.append("rect")
        .attr("width", d => d.x1 - d.x0)  // Width of the rectangle
        .attr("height", d => d.y1 - d.y0)  // Height of the rectangle
        .attr("fill", d => colorScale(datasetType))  // Fill color based on datasetType
        .attr("stroke", "white")
        
        .on("mouseover", function(event, d) {
            highlightSharedRealms(d.data.name);
        })
        .on("mouseout", function(event, d) {
            resetHighlight();
        })
                // Add click event to each realm
        .on("click", function(event, d) {
        const clickedRealm = d.data.name; // Get the name of the clicked realm
        const rolesData = d.data.roles;   // Get the roles for this realm

        // Prepare data for the new treemap for roles
        const rolesHierarchyData = {
            name: clickedRealm,
            children: Object.entries(rolesData).map(([role, count]) => ({
                name: role,
                count: count
            }))
        };

    // Create a new treemap for roles
    createTreemap(rolesHierarchyData, `${datasetType}-roles`); // Call createTreemap again for roles
});

    // Add labels (realm names) to the rectangles
    cell.append("text")
        .attr("x", 5)
        .attr("y", 15)
        .attr("font-size", "12px")
        .attr("fill", "black")
        .text(d => d.data.name);  // Display the name of the realm
}
function gatherTimelineData(data, realm) {
    const yearCount = {};

    // Iterate through each person data entry
    for (const entry of data) {
        if (entry.realm === realm) {
            // Extract the year(s) and convert to decades
            const dates = entry.date;  // Dates can be a single year or an array of year strings

            dates.forEach(date => {
                let year;
                // Check if the date is a decade or a single year
                const decadeMatch = date.match(/(\d{4})s/);  // Match for '1860s'
                if (decadeMatch) {
                    year = parseInt(decadeMatch[1]); // Extract the year (e.g., 1860)
                } else {
                    year = new Date(date).getFullYear(); // Attempt to get the year directly
                }

                // Only count valid years
                if (year) {
                    // Increment count for this decade
                    const decade = Math.floor(year / 10) * 10; // Convert to decade (e.g., 1860)
                    if (yearCount[decade]) {
                        yearCount[decade] += 1; // Increment count for the decade
                    } else {
                        yearCount[decade] = 1; // Initialize count for this decade
                    }
                }
            });
        }
    }

    // Convert the yearCount object into an array for easier visualization
    return Object.entries(yearCount).map(([year, count]) => ({
        year: year,
        count: count
    }));
}
function createTimeline(data) {
    // Remove previous timeline if it exists
    d3.select("#timeline").select("svg").remove(); 

    const width = 700;  // Width for the timeline
    const height = 100; // Height for the timeline
    const margin = { top: 10, right: 30, bottom: 30, left: 40 };

    // Set up the SVG for the timeline
    const svg = d3.select("#timeline")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Use the globalMinYear and globalMaxYear to ensure consistent x-axis range
    const x = d3.scaleLinear()
        .domain([globalMinYear, globalMaxYear + 10])  // Add 10 to extend the scale past the last decade
        .range([margin.left, width - margin.right]);

    // Set up the y-scale for the count values
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)]).nice()
        .range([height - margin.bottom, margin.top]);

    // Add the bars to the timeline
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.year))  // Position based on the start of the decade (or year)
        .attr("y", d => y(d.count))  // Position the top of the bar based on count
        .attr("height", d => y(0) - y(d.count))  // Set the height of the bar
        .attr("width", d => x(+d.year + 10) - x(d.year))  // Span the width from this decade to the next
        .attr("fill", "steelblue");

    // Add x-axis to show year/decade labels
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d => d));  // Format the x-axis with year/decade labels

    // Add y-axis to show counts
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));
}
function gatherTimelineDataForRole(data, role) {
    const yearCount = {};

    // Iterate through each person data entry
    for (const entry of data) {
        if (entry.role === role) {
            // Extract the year(s) and convert to decades
            const dates = entry.date;  // Dates can be a single year or an array of year strings

            dates.forEach(date => {
                let year;
                // Check if the date is a decade or a single year
                const decadeMatch = date.match(/(\d{4})s/);  // Match for '1860s'
                if (decadeMatch) {
                    year = parseInt(decadeMatch[1]); // Extract the year (e.g., 1860)
                } else {
                    year = new Date(date).getFullYear(); // Attempt to get the year directly
                }

                // Only count valid years
                if (year) {
                    // Increment count for this decade
                    const decade = Math.floor(year / 10) * 10; // Convert to decade (e.g., 1860)
                    if (yearCount[decade]) {
                        yearCount[decade] += 1; // Increment count for the decade
                    } else {
                        yearCount[decade] = 1; // Initialize count for this decade
                    }
                }
            });
        }
    }

    // Convert the yearCount object into an array for easier visualization
    return Object.entries(yearCount).map(([year, count]) => ({
        year: year,
        count: count
    }));
}


// Function to transform data into a hierarchical structure
function transformDataToHierarchy(data) {
    if (data.children) {
        return data;
    }

    const hierarchyData = {
        name: "root",
        children: []
    };

    data.forEach(d => {
        const realmNode = {
            name: d.realm,
            count: d.count,
            roles: d.roles,
            children: Object.entries(d.roles).map(([role, count]) => ({
                name: role,
                count: count
            }))
        };

        hierarchyData.children.push(realmNode);
    });

    return hierarchyData;
}

// Function to highlight shared realms
function highlightSharedRealms(realmName) {
    d3.selectAll("rect")
        .filter(d => d.data.name === realmName)
        .attr("stroke", "red")
        .attr("stroke-width", 3);
}

// Function to reset highlight
function resetHighlight() {
    d3.selectAll("rect")
        .attr("stroke", "white")
        .attr("stroke-width", 1);
}

