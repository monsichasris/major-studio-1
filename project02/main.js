
let allRealmData=[{}, {}], index=0, hierarchyData = [], roleData =[];

let globalMinYear, globalMaxYear, globalMaxY = 0;

// Load and analyze both men's and women's data simultaneously
Promise.all([
    d3.json('data/data_women.json'),
    d3.json('data/data_men.json')
]).then(function([dataWomen, dataMen]) {
    Promise.all([
    allRealmData[0] =analyseData(dataWomen),
    allRealmData[1] =analyseData(dataMen)])
    .then(
       Promise.all([ hierarchyData=[mapData(allRealmData[0]), mapData(allRealmData[1])]])
        .then(
            createTreemap(hierarchyData[0], 0),
            createTreemap(hierarchyData[1], 1),
        )
    )
    
}).catch(function(error) {
    console.error('Error loading the JSON data:', error);
});

let sitter_count, datum, current_usable_object, people_data = [], realm_data, role_data;
function analyseData(data, index) {
    // going through each portrait
    people_data=[];
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
  
return (people_data)

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


    return hierarchyData;
}


const colorScale = d3.scaleOrdinal()
    .domain(["1", "0"])
    .range(["#D0FC83", "#D49EFF"]);





function createTreemap(data, index) {
    const width = 600;  // Width of the treemap for each dataset
    const height = 600; // Height of the treemap for each dataset

// Transform the data into a hierarchical structure
hierarchyData[index] = transformDataToHierarchy(data);

console.log(hierarchyData[index] )

// Create the root of the hierarchy

const root = d3.hierarchy(hierarchyData[index])
    .sum(d => d.count)
    .sort((a, b) => b.value - a.value);





// Create the treemap layout
d3.treemap()
    .size([width, height])
    .padding(1)
    (root);


// Remove any existing SVG element in the correct container

d3.select(`#treemap-${index}`).select("svg").remove();
console.log(index)
// Create the SVG element where the treemap will be drawn
const svg = d3.select(`#treemap-${index}`)
    .append("svg")
    .attr("width", width)
    .attr("height", height);



    // Create a tooltip element
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("border-radius", "3px")
        .style("box-shadow", "0px 0px 5px rgba(0, 0, 0, 0.3)");

    // Draw the rectangles for each realm node
    const cell = svg.selectAll("g")
        .data(root.leaves())  // Using 'leaves' ensures we only display leaf nodes (realms in this case)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`)  // Positioning each cell based on layout

    cell.append("rect")
        .attr("width", d => d.x1 - d.x0)  // Width of the rectangle
        .attr("height", d => d.y1 - d.y0)  // Height of the rectangle
        .attr("fill", d => colorScale(index))  // Fill color based on datasetType
        .attr("stroke", "white")
     
        .on("mouseover", function(event, d) {
            highlightSharedRealms(d.data.name);
            tooltip.style("visibility", "visible")
                .text(`${d.data.name}: ${d.data.count}`);
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function(event, d) {
            resetHighlight();
            tooltip.style("visibility", "hidden");
        })
        // on click event show the children data inside the realm treemap
        .on("click", function(event, d) {
            
            const namey = d.data.name; // Get the name from the clicked data
        
            // Find the child in hierarchyData[0].children with the same name
            const childFromHierarchy0 = hierarchyData[0].children.find(child => child.name === namey);
            const childFromHierarchy1 = hierarchyData[1].children.find(child => child.name === namey);
        
            // Check if the children were found
            if (!childFromHierarchy0 || !childFromHierarchy1) {
                console.log("Child not found in one or both hierarchies for name:", namey);
                return; // Exit if not found
            }
        
            // Create the roleHierarchyData object
            const roleHierarchyData = {
                name: d.data.name,
                roleData: {
                    0: childFromHierarchy0.roles, // Using property names without quotes
                    1: childFromHierarchy1.roles
                },
                // Assuming roleData is defined elsewhere, or you need to define it
                children: Object.entries(roleData).map(([role, count]) => ({
                    name: role,
                    count: count
                }))
            };
        
           
            // Call the createTreemap function for each roleData
            createTreemap(roleHierarchyData.roleData[0], 0);
            createTreemap(roleHierarchyData.roleData[1], 1);
        });
        



     
        
  // Add labels (realm names) to the rectangles
    cell.append("text")
        .attr("x", 5)
        .attr("y", 15)
        .attr("font-size", "12px")
        .attr("fill", "black")
        .text(d => d.data.name)
        .style("display", d => (d.y1 - d.y0 > 10 ? "block" : "none"));  // Display the name of the realm
   
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
    // Check if data already has a children property, returning it as is
    if (data.children) {
        return data;
    }

    // Initialize the hierarchyData with a root name
    const hierarchyData = {
        name: "root",
        children: []
    };

    // Log the input data for debugging
    console.log(data);

    // Transform each role-count pair into the desired hierarchy structure
    Object.entries(data).forEach(([role, count]) => {
        const realmNode = {
            name: role,
            count: count,
            roles: { [role]: count }, // Keep the role structure if necessary
            children: [] // Initialize an empty children array if needed later
        };

        // Push the realmNode to the children of hierarchyData
        hierarchyData.children.push(realmNode);
    });

    return hierarchyData; // Return the transformed hierarchy
}


// Function to highlight shared realms
function highlightSharedRealms(realmName) {
    d3.selectAll("rect")
        .filter(d => d.data.name !== realmName)
        .attr("opacity", "0.2");
    d3.selectAll("text")
        .filter(d => d.data.name !== realmName)
        .attr("fill", "gray");
}

// Function to reset highlight
function resetHighlight() {
    d3.selectAll("rect")
    .attr("opacity", "1")
    d3.selectAll("text")
    .attr("fill", "black");
}

// function drawingChildren()
// {
//     const roleData = d.data.roles;
//             const roleHierarchyData = {
//                 name: d.data.name,
//                 //roles should be filtered by the name as the realm
//                 children: Object.entries(roleData).map(([role, count]) => ({
//                     name: role,
//                     count: count
//                 }))
//             };
//             createTreemap(roleHierarchyData, 'men');
//             createTreemap(roleHierarchyData, 'women');
// }
