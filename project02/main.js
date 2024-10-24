
let allRealmData=[{}, {}], index=0, hierarchyData = [], roleData =[], pretimeline_data, forPeople=[[],[]];

let globalMinYear=0, globalMaxYear=0, globalMaxY = 0;
let sitter_count, datum, current_usable_object, people_data = [], realm_data, role_data;

// Get the back button element from the DOM
document.addEventListener("DOMContentLoaded", function() {
    const backButton = document.getElementById("backButton");
    if (!backButton) {
        console.error("Back button element not found in the DOM.");
        return;
    }

    let treemapClicked = false;

// Load and analyze both men's and women's data simultaneously
Promise.all([
    d3.json('data/data_women.json'),
    d3.json('data/data_men.json')
]).then(function([dataWomen, dataMen]) {
    Promise.all([
    allRealmData[0] =analyseData(dataWomen, 0),
    allRealmData[1] =analyseData(dataMen, 1)])
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


function analyseData(data, index) {
    
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
                "date": datum.date,
                "link": datum.link,
                "thumbnail": datum.thumbnail,

            }
            
            people_data.push(current_usable_object);
            
            };

        }
            
    } 
} 
// Calculate the global minimum and maximum years in the dataset
     const allYears = people_data.flatMap(entry => {
        const dates = entry.date; // Assuming entry.date contains all the years associated with the entry
        return dates.map(date => {
            const decadeMatch = date.match(/(\d{4})s/);
            return decadeMatch ? parseInt(decadeMatch[1]) : new Date(date).getFullYear();
        });
    });

       // Assuming the analyseData function processes the data and fills allYears
    // Now, we can determine globalMinYear and globalMaxYear
    globalMinYear = Infinity;
    globalMaxYear = -Infinity;

    // Iterate over all years to find min and max
    for (let year of allYears) {
        if (year < globalMinYear) globalMinYear = year;
        if (year > globalMaxYear) globalMaxYear = year;
    }
    
forPeople[index] =people_data;
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
    .domain([1, 0])
    .range(["#D0FC83", "#D49EFF"]);


function createTreemap(data, index) {
    const width = 600;  // Width of the treemap for each dataset
    const height = 600; // Height of the treemap for each dataset

// Transform the data into a hierarchical structure
hierarchyData[index] = transformDataToHierarchy(data);

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
            handleTreemapClick(event, d);
        });

        cell.append("text")
            .attr("x", 5)
            .attr("y", 15)
            .attr("font-size", "12px")
            .attr("fill", "black")
            .text(d => d.data.name)
            .style("display", d => {
                const rectWidth = d.x1 - d.x0;
                const rectHeight = d.y1 - d.y0;
                const containerWidth = 600; // Assuming the container width is 600
                const containerHeight = 600; // Assuming the container height is 600
                return (rectWidth * rectHeight > 0.01 * containerWidth * containerHeight) ? "block" : "none";
            }) // Display the name of the realm
            .call(wrapText);

        function wrapText(selection) {
            selection.each(function(d) {
                const rectWidth = d.x1 - d.x0;
                const text = d3.select(this);
                const words = text.text().split(/\s+/).reverse();
                let word, line = [], lineNumber = 0;
                const lineHeight = 1.1, y = text.attr("y"), dy = 0;
                let tspan = text.text(null).append("tspan").attr("x", 5).attr("y", y).attr("dy", dy + "em");

                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > rectWidth) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", 5).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
            });
        }
} 

function handleTreemapClick(event, d) {
    const namey = d.data.name; // Get the name from the clicked data

    // Find the child in hierarchyData[0].children with the same name
    const childFromHierarchy0 = hierarchyData[0].children.find(child => child.name === namey);
    const childFromHierarchy1 = hierarchyData[1].children.find(child => child.name === namey);

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

    treemapClicked = true; // Set the flag to disable further clicks
    backButton.style.display = "block"; // Show the back button

            //for the timelines

            if (isRealm(d.data)) {
                pretimeline_data =[(allRealmData[0].filter(item => item.realm === roleHierarchyData.name)), (allRealmData[1].filter(item => item.realm === roleHierarchyData.name))];
                const timelineData = gatherTimelineData(pretimeline_data, d.data.name );
                createTimeline(timelineData);
            } else {
                pretimeline_data =[allRealmData[0].filter(item => item.role === roleHierarchyData.name), allRealmData[1].filter(item => item.role === roleHierarchyData.name)]
                const timelineData = gatherTimelineDataForRole(pretimeline_data, roleHierarchyData.name);
                createTimeline(timelineData);
                showPeople(d.data.name);
            }

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

// Event listener for the back button
backButton.addEventListener("click", function() {
    // Clear the treemap container
    d3.selectAll(`#treemap-0, #treemap-1`).selectAll("*").remove();

    // Recreate the treemaps
    createTreemap(hierarchyData[0], 0);
    createTreemap(hierarchyData[1], 1);

    // Clear the timeline and people thumbnails
    d3.select("#timeline").selectAll("*").remove();
    d3.select("#people-thumbnails").selectAll("*").remove();

    

    treemapClicked = false; // Reset the flag to enable clicks
    backButton.style.display = "none"; // Hide the back button
});
});

function isRealm(data)
{
if(Object.keys(data.roles).length>1)
    return true;
else
    return false;
}
//still have to stack the bars
function gatherTimelineData(data, realm) {
    const yearCount = {};
    let timelineData =[];
    // Iterate through each person data entry
    for (j=0; j<data.length; j++)
    {
        let data1=data[j];
        for (i=0; i<data1.length; i++) {
            entry = data1[i]
            // Extract the year(s) and convert to decades
            const dates = entry.date;  // Dates can be a single year or an array of year strings
          
            if(dates[0]){
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
    timelineData[j]= Object.entries(yearCount).map(([year, count]) => ({
        year: year,
        count: count
        
    }));
    }
    

// Update the global max Y value if a higher count is found
const maxCount = d3.max(timelineData, d => d.count);
globalMaxY = Math.max(globalMaxY, maxCount);  // Keep track of the global max count for y-axis normalization

return timelineData;

}



function gatherTimelineDataForRole(data, role) {
    const yearCount = {};
    let timelineData =[];
    // Iterate through each person data entry
    for (j=0; j<data.length; j++)
    {
        let data1=data[j];
         // Iterate through each person data entry
        for (i=0; i<data1.length; i++) {
            entry = data1[i]
            // Extract the year(s) and convert to decades
            const dates = entry.date;  // Dates can be a single year or an array of year strings
        if(dates[0]) {
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

    
   
    if(yearCount)
    {
        timelineData[j] = Object.entries(yearCount).map(([year, count]) => ({
            year: year,
            count: count
        }));
    }
    else 
    {
        timelineData[j] = Object.entries(yearCount).map(([year, count]) => ({
            year: none,
            count: 0
        }));
    }
   


    }

    // Update the global max Y value if a higher count is found
     maxCount = d3.max((timelineData[0]+timelineData[1]), d => d.count);
    globalMaxY = Math.max(globalMaxY, maxCount);  // Keep track of the global max count for y-axis normalization
    
    return timelineData;
    
}

function showPeople(selectedRole) {
    console.log("hi");
    let x=0;
    console.log(selectedRole);
    d3.select("#people-thumbnails").selectAll("div").remove(); // Clear previous thumbnails
    console.log("people data:")
    
    for (i=0; i<2; i++)
    {
        console.log(forPeople[0])
        
    const peopleInRole = forPeople[i].filter(person => person.role === selectedRole);
    
    const thumbnailsDiv = d3.select("#people-thumbnails");
    
    peopleInRole.forEach(person => {
        console.log(person)
        const personDiv = thumbnailsDiv.append("div").attr("class", "person-thumbnail");
      

        // Create an anchor element with the href linking to the full-size image or another resource
        const link = personDiv.append("a")
            .attr("href", person.link) // Link to the full-size image or some other resource
            .attr("target", "_blank"); // Open link in a new tab
        x+=20;
        // Append the image inside the anchor tag
        link.append("img")
            .attr("src", person.thumbnail) // Thumbnail version of the image
            .attr("alt", person.name)
            .attr("height", 100) // Optional, you can adjust as necessary
            .attr('x', x+20)

       personDiv.append("p").text(person.name)
       
    });
    }
    
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
function highlightSharedRealms(name) {
    d3.selectAll("rect")
        .filter(d => d.data.name !== name)
        .attr("opacity", "0.2");
    d3.selectAll("text")
        .filter(d => d.data.name !== name)
        .attr("fill", "gray");
}

// Function to reset highlight
function resetHighlight() {
    d3.selectAll("rect")
    .attr("opacity", "1")
    d3.selectAll("text")
    .attr("fill", "black");
}

function isRealm(data)
{
   
if(Object.keys(data.roles).length>2)
    return true;
else
    return false;
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

    // Helper function to group by decades
    function getDecade(year) {
        return Math.floor(year / 10) * 10;
    }

    // Extract all unique decades from the datasets
    let allDecades = new Set();
    
    data.forEach(dataset => {
        dataset.forEach(entry => {
            allDecades.add(getDecade(+entry.year));  // Add the decade to the Set
        });
    });

    allDecades = Array.from(allDecades).sort();  // Convert to array and sort

    // Normalize the datasets by filling missing decades with count = 0
    const normalizedData = allDecades.map(decade => {
        let result = { decade: +decade };
        data.forEach((dataset, index) => {
            const entry = dataset.find(e => getDecade(+e.year) === decade);
            result[`dataset${index}`] = entry ? entry.count : 0;  // Add count for each dataset
        });
        return result;
    });

    // Set up the x-scale to represent decades
    const x = d3.scaleBand()
        .domain(allDecades)  // Use decades as x-axis labels
        .range([margin.left, width - margin.right])
        .padding(0.1);  // Add some padding between bars

    // Set up the y-scale for the count values (stack height)
    const y = d3.scaleLinear()
        .domain([0, d3.max(normalizedData, d => d3.sum(Object.values(d).slice(1)))])  // Sum counts for y-axis
        .range([height - margin.bottom, margin.top]);

    

    // D3 stack generator for the normalized data
    const stack = d3.stack()
        .keys(d3.range(data.length).map(i => `dataset${i}`));  // Stack by `dataset0`, `dataset1`, etc.

    // Stack the data based on decades
    const series = stack(normalizedData);

    // Add the stacked bars to the timeline
    svg.selectAll(".layer")
        .data(series)
        .enter().append("g")
        .attr("class", "layer")
        .attr("fill", (d, i) => colorScale(i))  // Assign color to each layer (dataset)
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x(d.data.decade))  // x-position based on decade
        .attr("y", d => y(d[1]))  // Top of the stack
        .attr("height", d => y(d[0]) - y(d[1]))  // Height based on the difference in stack levels
        .attr("width", x.bandwidth());  // Width of the bar

    // Add x-axis to show decade labels
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d => d));  // Format the x-axis with decade labels

    // Add y-axis to show counts
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));
}




// Event listener for the back button
backButton.addEventListener("click", function() {
    // Clear the treemap container
    d3.select(`#treemap-${index}`).selectAll("*").remove();

    // Recreate the realm treemap
    createTreemap(hierarchyData[0], 0);
    createTreemap(hierarchyData[1], 1);

    // Clear the timeline and people thumbnails
    d3.select("#timeline").selectAll("*").remove();
    d3.select("#people-thumbnails").selectAll("*").remove();

    treemapClicked = false; // Reset the flag to enable clicks
    backButton.style.display = "none"; // Hide the back button
});
console.log(backButton); 
    // on click event show the children data inside the realm treemap
    d3.selectAll("rect").on("click", function(event, d) {
        if (treemapClicked) {
            console.log("Click event disabled after first click");
            return; // Exit if the treemap has already been clicked
        }

        if (d.data.isChild) {
            console.log("Click event disabled for child treemap");
            tooltip.style("visibility", "hidden"); // Hide the tooltip
            return; // Exit if it is a child treemap
        }

        handleTreemapClick(event, d); // Call the new function

    });
});