

colors=[];
colors
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
       
    // Get the hierarchical data for the treemap
    let hierarchyData = mapData(people_data);

    // Create the treemap using the hierarchical data
    createTreemap(hierarchyData, datasetType);
 }

 function mapData(data) {
    let realm_data = new Map();  // Initialize the Map to store realm counts
    let peopleInRealm = {};  // Initialize an object to store arrays of names for each realm

    // Extract unique realms from the data
    let realms = data.map(d => d.realm).filter((value, index, self) => self.indexOf(value) === index);
    console.log(realms);

    // Initialize arrays for each realm in the peopleInRealm object
    realms.forEach(realm => {
        peopleInRealm[realm] = [];
    });
    
    // Iterate through each datapoint
    for (let i = 0; i < data.length; i++) {
        let realm = data[i].realm;  // Extract the realm from the data object
        let name = data[i].name;  // Extract the name from the data object
        let role = data[i].role;  // Extract the role from the data object

        // Check if the name is already counted in the current realm
        if (peopleInRealm[realm].includes(name)) {
            continue;  // Skip if the name is already counted
        }

        // Add the name to the array for the current realm
        peopleInRealm[realm].push(name);

        // Update the count and roles for the current realm in the Map
        if (realm_data.has(realm)) {
            let realmInfo = realm_data.get(realm);
            realmInfo.count += 1;
            if (!realmInfo.roles.includes(role)) {
                realmInfo.roles.push(role);
            }
            if (realmInfo.roleCounts[role]) {
                realmInfo.roleCounts[role] += 1;
            } else {
                realmInfo.roleCounts[role] = 1;
            }
            realm_data.set(realm, realmInfo);
        } else {
            realm_data.set(realm, { count: 1, roles: [role], roleCounts: { [role]: 1 } });
        }
    }

    console.log(realm_data);

    // Convert the Map into a hierarchical structure for the treemap
   // Convert the realm_data Map into a hierarchical structure for the treemap
let hierarchyData = {
    name: "Root",
    children: Array.from(realm_data).map(([realm, realmInfo]) => ({
        name: realm,     // Name of the realm
        count: realmInfo.count,  // Count of individuals in that realm
        // No children to show roles, keeping it simple
    }))
};


    console.log(hierarchyData);
    return hierarchyData;
}function createTreemap(data, datasetType) {
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
    const svg = d3.select("#chart").append("svg")
        .attr("id", `${datasetType}-treemap`) // Unique ID for each treemap (e.g., "women-treemap")
        .attr("width", width)
        .attr("height", height);

    // Draw the rectangles for each realm node
    const cell = svg.selectAll("g")
        .data(root.leaves())  // Using 'leaves' ensures we only display leaf nodes (realms in this case)
        .enter().append("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);  // Positioning each cell based on layout

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


