

colors=[];
colors
let globalMinYear, globalMaxYear,  globalMaxY = 0; ;

d3.json('data/data_women.json').then(function(dataWomen) {
    analyseData(dataWomen, "women");
}).catch(function(error) {
    console.error('Error loading the women JSON data:', error);
});

let sitter_count, datum, current_usable_object, people_data = [], realm_data, role_data;
function analyseData(data, datasetType) 
{
    // going through each portrait
    for (let i = 0; i < data.length; i++) 
        {
        datum = data[i];
        //going through each sitter in an individual datum
       
        for (let j = 0; j < datum.sitter.length; j++) {
            sitter_count= d3.rollup(
                datum.sitter,
                v => v.length,
                d => d.substring(0, datum.sitter[j].indexOf(':')))
             
            if(sitter_count.size==1)
            {
                //this is checking for portraits that have only one sitter to ensure that its indivuual portraits and not group
                //its adding it until it finds a different name. it should add it if it only has one name
            let name = datum.sitter[j].substring(0, datum.sitter[j].indexOf(':'))
            let realm = datum.sitter[j].substring(datum.sitter[j].indexOf(':') + 2, datum.sitter[j].indexOf('\\'));
            let role = datum.sitter[j].substring(datum.sitter[j].lastIndexOf('\\') + 1, datum.sitter[j].length);
//we only want it if it has a date
            if(datum.date)
                {
            
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
       
     // Calculate the global minimum and maximum years in the dataset
     const allYears = people_data.flatMap(entry => {
        const dates = entry.date; // Assuming entry.date contains all the years associated with the entry
        return dates.map(date => {
            const decadeMatch = date.match(/(\d{4})s/);
            return decadeMatch ? parseInt(decadeMatch[1]) : new Date(date).getFullYear();
        });
    });

    globalMinYear = Math.min(...allYears);
    globalMaxYear = Math.max(...allYears);
    
    // Now you can call createTreemap() or other functions as needed
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



function createTreemap(data, datasetType) {
    const width = 700;  // Width of the treemap for each dataset
    const height = 600; // Height of the treemap for each dataset

    // Create the root of the hierarchy from the data, summing only at the realm level
    const root = d3.hierarchy(data)
        .eachBefore(d => {
            // Set 'count' at each realm level by summing its children's counts
            if (d.children) {
                d.value = d.children.reduce((acc, child) => acc + child.count, 0);
            }
        })
        .sum(d => d.count);  // Sum the 'count' value only for realms

    // Set up the treemap layout with the size and padding options
    const treemap = d3.treemap()
        .size([width, height])  // Set the dimensions of the treemap
        .padding(2)  // Add some padding between the nodes
        .round(true);  // Ensure that the rectangles have integer coordinates (removes gaps)

    // Apply the treemap layout to the data
    treemap(root);

    // Create the SVG element where the treemap will be drawn
    const svg = d3.select("#chart").select("svg").remove(); // Remove the old treemap if it exists
    const newSvg = d3.select("#chart").append("svg")
        .attr("id", `${datasetType}-treemap`) // Unique ID for each treemap (e.g., "women-treemap")
        .attr("width", width)
        .attr("height", height);

    // Draw the rectangles for each realm node
    const cell = newSvg.selectAll("g")
        .data(root.leaves())  // Using 'leaves' ensures we only display leaf nodes (realms in this case)
        .enter().append("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`)  // Positioning each cell based on layout

        // Add click event to each realm or role
.on("click", function(event, d) {
    const clickedName = d.data.name; // Get the name of the clicked realm or role
    const rolesData = d.data.roles;  // Get the roles for this realm (only available at realm level)
    
    if (rolesData) {
        // If rolesData exists, we are clicking on a realm
        const rolesHierarchyData = {
            name: clickedName,
            children: Object.entries(rolesData).map(([role, count]) => ({
                name: role,
                count: count
            }))
        };

        // Gather date data for timeline for the clicked realm
        const timelineData = gatherTimelineData(people_data, clickedName);

        // Create a new treemap for roles within this realm
        createTreemap(rolesHierarchyData, `${datasetType}-roles`);

        // Update the timeline for the clicked realm
        createTimeline(timelineData);
    } else {
        // If no rolesData, we are clicking on a role, so update the timeline for that role
        const timelineData = gatherTimelineDataForRole(people_data, clickedName);
        createTimeline(timelineData);
    }
});
        

    // Add rectangles to represent each realm
    cell.append("rect")
        .attr("width", d => d.x1 - d.x0)  // Width of the rectangle
        .attr("height", d => d.y1 - d.y0)  // Height of the rectangle
        .attr("fill", d => {
            // Assign color based on dataset type (e.g., "women" or "men")
            return datasetType === "women" ? "lightcoral" : "lightblue";
        })
        .attr("stroke", "white");

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

   const timelineData = Object.entries(yearCount).map(([year, count]) => ({
    year: year,
    count: count
}));

// Update the global max Y value if a higher count is found
const maxCount = d3.max(timelineData, d => d.count);
globalMaxY = Math.max(globalMaxY, maxCount);  // Keep track of the global max count for y-axis normalization

return timelineData;

}
function createTimeline(data) {
    // Remove previous timeline if it exists
    d3.select("#timeline").select("svg").remove(); 

    const width = window.innerWidth;  // Width for the timeline
    const height = 300; // Height for the timeline
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
    .domain([0, globalMaxY])  // Normalize y-axis using the global maximum count
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

    const timelineData = Object.entries(yearCount).map(([year, count]) => ({
        year: year,
        count: count
    }));
    
    // Update the global max Y value if a higher count is found
    const maxCount = d3.max(timelineData, d => d.count);
    globalMaxY = Math.max(globalMaxY, maxCount);  // Keep track of the global max count for y-axis normalization
    
    return timelineData;
    
}


