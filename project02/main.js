


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
       mapData(people_data);
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
return realm_data;

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



    // if (d.data.count>0){
    // // Add labels to the rectangles only if the height is greater than 10px and wrap text if necessary
    // cell.append("text")
    // .attr("x", 5)
    // .attr("y", 15)
    // .attr("font-size", "12px")
    // .attr("fill", "black")
    // .text(d => d.data.name);
    // }

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
    addInteractions(svg, datasetType);
}

function addInteractions(svg, datasetType) {
    // Select all rectangles across both treemaps (men and women)
    d3.selectAll(`#${datasetType}-treemap rect`)
        .on("mouseenter", function(event, d) {
            const hoveredLabel = d.data.name; // Get the label of the hovered rectangle
            const category = datasetType === "men" && isRoleTreemapMen || datasetType === "women" && isRoleTreemapWomen 
                ? "role" : "realm"; // Determine category based on dataset

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
            if ((datasetType === "men" && isRoleTreemapMen) || (datasetType === "women" && isRoleTreemapWomen)) {
                createTimeline(aggregatedDataMen, category, hoveredLabel);  // For roles, use men/women data
            } else {
                createTimeline(aggregatedDataWomen, category, hoveredLabel);  // For realms, use women data
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

    const timelineData = date[category][hoveredLabel] ; //need to make this line make sense that's all //startHere

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
    const svg = d3.select("#chart").append("svg")
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
