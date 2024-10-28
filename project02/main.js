
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

    let treemapClicked = false; // Global flag to track if the treemap has been clicked

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
    people_data=[]
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
    
forPeople[index] =[...people_data];

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

const width = window.innerWidth;
const height = 300; 

// Event listener for the back button
backButton.addEventListener("click", function() {
    // Clear the treemap container
    d3.select(`#treemap-0, #treemap-1`).selectAll("*").remove();
    // Recreate the treemaps from the realm data
    createTreemap(mapData(allRealmData[0]), 0);
    createTreemap(mapData(allRealmData[1]), 1);


    d3.select("#timeline").selectAll("*").remove();
    d3.select("#people-thumbnails").selectAll("*").remove();
    treemapClicked = false; // Reset the flag to enable clicks
    backButton.style.display = "none"; // Hide the back button
});

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

    const svg = d3.select(`#treemap-${index}`)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const cell = svg.selectAll("g")
        .data(root.leaves())  // Using 'leaves' ensures we only display leaf nodes (realms in this case)
        .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);  // Positioning each cell based on layout

    cell.append("rect")
        .attr("width", d => d.x1 - d.x0)  // Width of the rectangle
        .attr("height", d => d.y1 - d.y0)  // Height of the rectangle
        .attr("fill", d => colorScale(index))  // Fill color based on datasetType
        .attr("stroke", "white")
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            // Show the name and count in the info area
            updateHoverInfo(d.data.name);
            highlightSharedRealms(d.data.name);
        })
        .on("mouseout", function(event, d) {
            resetHighlight();
            // Clear the info area when the mouse leaves
            clearHoverInfo();
        })
        // On click event show the children data inside the realm treemap
        .on("click", function(event, d) {
            handleClick(event, d);
        });

    // Add labels (realm names) to the rectangles
    cell.append("text")
        .attr("x", 5)
        .attr("y", 15)
        .attr("font-size", "12px")
        .attr("fill", "black")
        .text(d => d.data.name)
        // Only display the label if the rectangle is large enough
        .style("display", d => {
            const rectWidth = d.x1 - d.x0;
            const rectHeight = d.y1 - d.y0;
            const containerWidth = width;
            const containerHeight = height;
            return (rectWidth * rectHeight > 0.01 * containerWidth * containerHeight) ? "block" : "none";
        }) // Display the name of the realm
        .call(wrapText); // Wrap the text if it's too long
        
}

// Function to update hover info
function updateHoverInfo(name) {
    // Find the count for the given name in both datasets
    const maleCount = maleData.find(person => person.name === name)?.count || 0; // Using optional chaining and default to 0
    const femaleCount = femaleData.find(person => person.name === name)?.count || 0; // Same as above

    // Update the hover info text
    d3.select("#hover-info")
        .text(`Name: ${name}, Male Count: ${maleCount}, Female Count: ${femaleCount}`);
}

// Function to clear hover info
function clearHoverInfo() {
    d3.select("#hover-info")
        .text("");
}


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

function handleClick(event, d) {
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
            count: count,
            isChild: true
        }))
    };
   


    
    // For the timelines
    if (isRealm(d.data)) {
        createTreemap(roleHierarchyData.roleData[0], 0);
        createTreemap(roleHierarchyData.roleData[1], 1);
        console.log(roleHierarchyData.name)
        highlightSharedRealms(roleHierarchyData.name)

        pretimeline_data = [
            allRealmData[0].filter(item => item.realm === roleHierarchyData.name),
            allRealmData[1].filter(item => item.realm === roleHierarchyData.name)
        ];
        const timelineData = gatherTimelineData(pretimeline_data, d.data.name);
        createTimeline(timelineData);
    } else {
        
            // console.log()
            pretimeline_data = [
                allRealmData[0].filter(item => item.role === roleHierarchyData.name),
                allRealmData[1].filter(item => item.role === roleHierarchyData.name)
            ];
            const timelineData = gatherTimelineDataForRole(pretimeline_data, roleHierarchyData.name);
            createTimeline(timelineData);
            showPeople(d.data.name);

        
       
    }
    treemapClicked = true; // Set the flag to disable further clicks
    backButton.innerHTML = `← ${d.data.name}`; // Show the back button with the name of the realm
    backButton.style.display = "block"; // Show the back button
    
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
    // Clear previous thumbnails
    d3.select("#people-thumbnails").selectAll("div").remove();

    // Create a flex container for women and men thumbnails
    const thumbnailsContainer = d3.select("#people-thumbnails");

    // Create two separate divs for women and men
    const womenDiv = thumbnailsContainer.append("div").attr("id", "women-thumbnails");
    const menDiv = thumbnailsContainer.append("div").attr("id", "men-thumbnails");

    // Iterate through gender-specific data
    for (let i = 0; i < 2; i++) {
        const peopleInRole = forPeople[i].filter(person => person.role === selectedRole);
        const thumbnailsDiv = (i === 0) ? womenDiv : menDiv; // Use the appropriate div based on index

        peopleInRole.forEach(person => {
            // Check if the person name already exists in the thumbnailsDiv
            if (!thumbnailsDiv.selectAll(".person-thumbnail").filter(function() { return d3.select(this).text() === person.name; }).empty()) {
                return; // Skip appending if the person name already exists
            }

            const personDiv = thumbnailsDiv.append("div").attr("class", "person-thumbnail");

            // Create an anchor element with the href linking to the full-size image or another resource
            const link = personDiv.append("a")
                

            // Append the image inside the anchor tag
            
                .style("cursor", "pointer");link.append("img")
                .attr("src", person.thumbnail) // Thumbnail version of the image
                .attr("alt", person.name)
                .attr("height", 100) // Optional, you can adjust as necessary
                .style("border", "10px solid") // Add border style
                .style("border-color", colorScale(i)); // Assign color based on index

            personDiv.append("text")
                .text(person.name)
                .attr("class", "person-name")

          console.log(person)
            
            
            personDiv
                .on("mouseover", function() {
                    d3.select(this)
                        .style('transform', 'scale(1.1)')
                        .style("font-size", "14px"); // Increase font size on mouse over
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .style('transform', 'scale(1)')
                        .style("font-size", "initial"); // Reset font size on mouse out
                })
                .on("click", function() { // Add click event
                    openModal(person.thumbnail, person.name, person.role, person.link, person.realm, person.date);
                });
        });
    }
}

// Function to open the modal
function openModal(imageSrc, personName, personRole, personLink, personRealm, personDate) {
    // Clear previous modal content
    d3.select("#modal").style("display", "flex");

    // Create a clickable image link
    const modalImageContainer = d3.select("#modal-image-container");

    // Remove existing content to avoid duplication
    modalImageContainer.selectAll("*").remove();

    // Append a link around the image
    modalImageContainer.append("a")
        .attr("href", personLink) // Set the link to the person's link
        .attr("target", "_blank") // Open link in a new tab
        .append("img")
        .attr("src", imageSrc)
        .attr("alt", personName)
        .style("max-width", "100%") // Ensure the image fits the modal
        .style("height", "auto");

    // Update text information
    d3.select("#modal-image").attr("src", imageSrc);
    d3.select("#modal-name").text(personName);
    d3.select("#modal1").text(personRole);
    d3.select("#modal2").text(personRealm);
    d3.select("#modal3").text(personDate);

    // Optional: If you want the link to be shown as text, you can still add it
    d3.select("#modal4")
        .html(`<a href="${personLink}" target="_blank">More Info</a>`);
}


// Close the modal
d3.select("#close-modal").on("click", function() {
    d3.select("#modal").style("display", "none");
});

// Close the modal when clicking outside the modal content
d3.select("#modal").on("click", function(event) {
    if (event.target === this) {
        d3.select("#modal").style("display", "none");
    }
});




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

function highlightSharedRealms(realmName) {
    d3.selectAll("rect")
        .filter(d => d.data.name !== realmName)
        .attr("opacity", "0.2");
    d3.selectAll("text")
        .filter(d => d.data.name !== realmName)
        .attr("fill", "gray");
}

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

    // Height for the timeline
    const margin = { top: 10, right: 100, bottom: 30, left: 100 };

    // Set up the SVG for the timeline
    const svg = d3.select("#timeline")
        .append("svg")
        .attr("width", width- margin.right)
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
            .call(d3.axisBottom(x).tickFormat(d => d).tickSize(0))  // Format the x-axis with decade labels
            .append("text")
            .attr("x", width / 2)
            .attr("y", margin.bottom)
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Decade");
        // Add y-axis to show counts
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(6))  // Limit the number of ticks to 6
            .append("text")
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", margin.left - 160)
            .attr("x", -height / 2)
            .style("font-size", "12px")
            .text("Count");
}

});
