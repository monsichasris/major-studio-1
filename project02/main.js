// Global variables to track which treemap is shown for both men and women
let isRoleTreemapMen = true;
let isRoleTreemapWomen = true;

people_data_men = [], people_data_women = [], colourBand=["#d49eff", "#d0fc83"];

d3.json('data/data_men.json').then(function(dataMen) {
    d3.json('data/data_women.json').then(function(dataWomen) {
        // Analyze and process both datasets
        analyseData(dataMen, "men");
        analyseData(dataWomen, "women");
    }).catch(function(error) {
        console.error('Error loading the women JSON data:', error);
    });
}).catch(function(error) {
    console.error('Error loading the men JSON data:', error);
});

function analyseData(data, datasetType) {
    let people_data = datasetType === "men" ? people_data_men : people_data_women;

    // Exclude portraits that are groups and prepare the data
    for (let i = 0; i < data.length; i++) {
        let datum = data[i];
        for (let j = 0; j < datum.sitter.length; j++) {
            let name = datum.sitter[j].substring(0, datum.sitter[j].indexOf(':'));
            let realm = datum.sitter[j].substring(datum.sitter[j].indexOf(':') + 2, datum.sitter[j].indexOf('\\'));
            let role = datum.sitter[j].substring(datum.sitter[j].lastIndexOf('\\') + 1, datum.sitter[j].length);
            
            let current_usable_object = {
                "name": name,
                "realm": realm,
                "role": role,
                "id": datum.id,
                "date": datum.date
            };
            people_data.push(current_usable_object);
        }
    }

    // Group the data by people and realm, and then by realm and role
    const realmData = d3.group(people_data, d => d.name, d => d.realm);
    const roleData = d3.group(people_data, d => d.realm, d => d.role);

    const count_roles = countRoles(roleData);
    const count_realms = countRealms(realmData);

    // Initially show the roles treemap for men or women based on the dataset
    if (datasetType === "men") {
        createTreemap(count_roles, datasetType);
    } else {
        createTreemap(count_roles, datasetType);
    }

    // Add toggle button functionality for men and women
    d3.select("body").append("button")
        .text(`Toggle ${datasetType} Treemap`)
        .on("click", function () {
            // Clear the existing treemap
            d3.select(`#${datasetType}-treemap`).remove();

            // Toggle between the two datasets
            if ((datasetType === "men" && isRoleTreemapMen) || (datasetType === "women" && isRoleTreemapWomen)) {
                createTreemap(count_realms, datasetType); // Show realms treemap
            } else {
                createTreemap(count_roles, datasetType); // Show roles treemap
            }

            // Toggle the flag based on dataset type
            if (datasetType === "men") {
                isRoleTreemapMen = !isRoleTreemapMen;
            } else {
                isRoleTreemapWomen = !isRoleTreemapWomen;
            }
        });
}

// Function to Count Categories and Format the Data for Treemap
function countRealms(groupedData) {
    const categoryCounts = {};

    groupedData.forEach((realmMap, personName) => {
        realmMap.forEach((entries, realm) => {
            const count = entries.length;
            if (categoryCounts[realm]) {
                categoryCounts[realm] += 1;
            } else {
                categoryCounts[realm] = 1;
            }
        });
    });

    const result = Object.entries(categoryCounts).map(([realm, count]) => ({
        name: realm,
        count: count
    }));

    return {
        name: "root",
        children: result  // The 'children' property contains the realms and their counts
    };
}

function countRoles(groupedData) {
    const realmCounts = {};

    groupedData.forEach((roleMap, realm) => {
        if (!realmCounts[realm]) {
            realmCounts[realm] = {
                name: realm,
                children: []
            };
        }

        roleMap.forEach((entries, role) => {
            const count = entries.length;
            realmCounts[realm].children.push({
                name: role,
                count: count
            });
        });
    });

    return { name: "root", children: Object.values(realmCounts) };
}

// Function to Create Treemap for specific dataset (men or women)
function createTreemap(data, datasetType) {
    const width = 700;  // Width of the treemap for each dataset
    const height = 600; // Height of the treemap for each dataset

    // Create the root of the hierarchy
    const root = d3.hierarchy(data)
        .sum(d => d.count); // The size of each rectangle will be proportional to the count

    // Set up the treemap layout
    const treemap = d3.treemap()
        .size([width, height])  // Set the dimensions of the treemap
        .padding(1);  // Space between the nodes

    // Apply the treemap layout to the data
    treemap(root);

    // Create the SVG element where the treemap will be drawn, using an ID to distinguish between men and women
    const svg = d3.select("body").append("svg")
        .attr("id", `${datasetType}-treemap`) // Unique ID for each treemap
        .attr("width", width)
        .attr("height", height);

    // Draw the rectangles for each node
    const cell = svg.selectAll("g")
        .data(root.leaves())
        .enter().append("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);  // Positioning each cell

    // Add rectangles to represent each category
    cell.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", colourBand[0])
        .attr("stroke", "white");

    // Add labels to the rectangles (optional)
    cell.append("text")
        .attr("x", 5)
        .attr("y", 15)
        .attr("font-size", "12px")
        .attr("fill", "white")
        .text(d => d.data.name);
}
function harshita_branch_check()
{
    console.log("hi")
}