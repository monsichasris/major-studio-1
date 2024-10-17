// Global variables to track which treemap is shown for both men and women
let isRoleTreemapMen = true;
let isRoleTreemapWomen = true;

people_data_men = [], people_data_women = [];
const colors = {
    "women": '#d49eff', //purple
    "men": '#d0fc83' //green
}

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

// Global variables to store aggregated data for timeline
let aggregatedDataMen = null;
let aggregatedDataWomen = null;

function analyseData(data, datasetType) 
{
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

    // Aggregate data by year for both realms and roles
    const aggregatedByRealm = aggregateByYear(people_data, "realm");
    const aggregatedByRole = aggregateByYear(people_data, "role");

    // Store the aggregated data for future use (when hovering over rectangles)
    if (datasetType === "men") {
        aggregatedDataMen = { realms: aggregatedByRealm, roles: aggregatedByRole };
        createTreemap(count_roles, datasetType);
    } else {
        aggregatedDataWomen = { realms: aggregatedByRealm, roles: aggregatedByRole };
        createTreemap(count_roles, datasetType);
    }

    // Add toggle button functionality for men and women
    d3.select("#filter")
        .append("button")
        .attr("class", "toggle")
        .text(`Toggle`)
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
    const svg = d3.select("#chart").append("svg")
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
        .attr("fill", colors[datasetType])
        .attr("stroke", "white");

    // Add labels to the rectangles only if the height is greater than 10px and wrap text if necessary
    cell.append("text")
        .attr("x", 5)
        .attr("y", 15)
        .attr("font-size", "12px")
        .attr("fill", "gray")
        .each(function(d) {
            const rectWidth = d.x1 - d.x0;  // Width of the rectangle
            const rectHeight = d.y1 - d.y0; // Height of the rectangle
            const textElement = d3.select(this);
            const words = d.data.name.split(" ");  // Split the text by words
            const lineHeight = 12; // Line height for each line of text
            let currentLine = [];
            let currentY = 15;  // Starting position for the first line of text
            let tspan = textElement.append("tspan").attr("x", 5).attr("y", currentY);

            words.forEach((word) => {
                currentLine.push(word);
                tspan.text(currentLine.join(" "));
                if (tspan.node().getComputedTextLength() > rectWidth - 10) {
                    currentLine.pop();  // Remove the last word and start a new line
                    tspan.text(currentLine.join(" "));
                    currentLine = [word];
                    currentY += lineHeight; // Move to the next line
                    tspan = textElement.append("tspan")
                        .attr("x", 5)
                        .attr("y", currentY)
                        .text(word);
                }
            });

            // Hide text if it exceeds the rectangle height
            if (rectHeight < (currentY + lineHeight)) {
                textElement.style("display", "none");
            }
        })
        .style("display", d => (d.y1 - d.y0 > 10 ? "block" : "none")); // Display only if height > 10px

    // Add hover interactions
    addInteractions(svg);
}

function addInteractions(svg) {
    // Select all rectangles across both treemaps (men and women)
    d3.selectAll("#men-treemap rect, #women-treemap rect")
        .on("mouseenter", function(event, d) {
            // Get the label of the hovered rectangle
            const hoveredLabel = d.data.name;
            const category = d3.select(this).node().parentNode.id.includes("realm") ? "realm" : "role"; // Determine category

            // On hover, reduce opacity of all rectangles in both treemaps
            d3.selectAll("rect").attr("opacity", 0.1);  // Set all rectangles to 10% opacity

            // Set the hovered rectangle to full opacity
            d3.select(this).attr("opacity", 1);

            // Highlight matching rectangles in both treemaps
            d3.selectAll("rect")
                .filter(function(dd) {
                    return dd.data.name === hoveredLabel;
                })
                .attr("opacity", 1);  // Set matching rectangles to full opacity

            // Call the timeline function for the hovered category (realm/role)
            if (isRoleTreemapMen && datasetType === "men") {
                createTimeline(aggregatedDataMen, category, hoveredLabel);
            } else if (isRoleTreemapWomen && datasetType === "women") {
                createTimeline(aggregatedDataWomen, category, hoveredLabel);
            }
        })
        .on("mouseleave", function() {
            // On leaving hover, reset all rectangles to full opacity
            d3.selectAll("rect").attr("opacity", 1);

            // Remove the timeline when mouse leaves
            d3.select("#timeline").remove();
        });
}


function createTimeline(data, category, hoveredLabel) {
    const timelineData = data[category][hoveredLabel]; // Ensure we're looking up the correct data for the hovered label

    // Check if there's data for the hovered label
    if (!timelineData) {
        console.error("No data available for this category and label.");
        return;
    }

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Remove existing timeline if any
    d3.select("#timeline").remove();

    // Create SVG for the timeline
    const svg = d3.select("body").append("svg")
        .attr("id", "timeline")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Get years and values for the timeline
    const years = Object.keys(timelineData).sort();  // Sort years in ascending order
    const values = years.map(year => timelineData[year]);

    // Set up scales for the timeline
    const x = d3.scaleBand()
        .domain(years)
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(values)])
        .nice()
        .range([height, 0]);

    // Add X axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add Y axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    // Add bars for the timeline
    svg.selectAll(".bar")
        .data(years)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d))
        .attr("y", d => y(timelineData[d]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(timelineData[d]))
        .attr("fill", "#69b3a2");
}


// Function to aggregate portraits per year for a given realm or role
function aggregateByYear(peopleData, category) {
    const aggregatedData = {};

    // Loop over the people data and aggregate by year
    peopleData.forEach(d => {
        const year = d.date; // Assuming 'date' is in the format YYYY
        const key = d[category];  // Can be either 'realm' or 'role'
        
        if (!aggregatedData[key]) {
            aggregatedData[key] = {};
        }

        if (!aggregatedData[key][year]) {
            aggregatedData[key][year] = 0;
        }

        aggregatedData[key][year]++;
    });

    return aggregatedData;
}
