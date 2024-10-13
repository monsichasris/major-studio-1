
 d3.json('data/data_women.json').then(function(data) {
    // Log the data to check its structure
    analyseData(data);
 }).catch(function(error) {
    console.error('Error loading the JSON data:', error);
    
  });

people_data=[], midstage_peoplearray=[], roles=[], realm_roles=[];

function analyseData(data)
{
    //exclude portraits that are groups

    //we need all data grouped by topic
     for(i=0; i<data.length; i++)
        { 
            datum =data[i];
            for(j=0; j<datum.sitter.length; j++)
            {
                //will traverse through each career in a particular data point: in each photo
                //find the first colon's index, create a substring of the word before it, that's our name.
                var name=datum.sitter[j].substring(0, datum.sitter[j].indexOf(':'));
                //find the first \\, create a substring of what's between the colon and the \\, that's our topic.
                var realm =datum.sitter[j].substring(datum.sitter[j].indexOf(':')+2, datum.sitter[j].indexOf('\\') );
                var role = datum.sitter[j].substring(datum.sitter[j].lastIndexOf('\\')+1, datum.sitter[j].length );
                current_usable_object={
                    "name": name,
                    "realm":  realm,
                    "role": role,
                    "id": datum.id,
                    "date": datum.date
                }
                people_data.push(current_usable_object);
                }
           
        }
     //we are grouping by people first, and then by realm inside each person so that we get an accurate count of the realms that each person was in.
   const realmData = d3.group(people_data, d => d.name, d=>d.realm);
   const roleData = d3.group(people_data, d => d.realm, d=>d.role);
   //console.log(roleData)
   roleData.forEach((role, realm) => {
        console.log(role); 
        console.log(realm); 
       
    });
    
    const count_roles = countRoles(roleData);
    const count_realms = countRealms(realmData);
    createTreemap(count_roles);
    createTreemap(count_realms);
};

  

     

 

  

//chatgpt

// Updated Function to Count Categories and Format the Data for Treemap
function countRealms(groupedData) {
    const categoryCounts = {};
  
    // Iterate over each person and their associated realms
    groupedData.forEach((realmMap, personName) => {
      // Iterate over each realm for the current person
      realmMap.forEach((entries, realm) => {
       
        
        // Get the number of entries for this realm
        const count = entries.length;
        //for the role stacked bar
        // if(count>1)
        // {console.log("count: "+count);}
        // If the realm already exists in categoryCounts, increment its count
        if (categoryCounts[realm]) {
          categoryCounts[realm] += 1;
          
        } else {
          // Otherwise, initialize the count for this realm
          categoryCounts[realm] = 1;

        }
      });
    });
  
    // Convert categoryCounts into an array of objects as desired
    const result = Object.entries(categoryCounts).map(([realm, count]) => ({
      name: realm,  // Realm name becomes the 'name' field for each node
      count: count  // Count is used as the size of the rectangle
    }));
  
    // Return the result wrapped in a root node for the treemap
    return {
      name: "root",
      children: result  // The 'children' property contains the realms and their counts
    };
  }

function countRoles(groupedData) {
const categoryCounts = {};

// Iterate over each person and their associated roles
groupedData.forEach((realmMap, personName) => {
    // Iterate over each realm for the current person
    realmMap.forEach((entries, role) => {
    
    // Get the number of entries for this realm
    const count = entries.length;
    
    // If the realm already exists in categoryCounts, increment its count
    if (categoryCounts[role]) {
        categoryCounts[role] += 1;
    } else {
        // Otherwise, initialize the count for this realm
        categoryCounts[role] = 1;
    }
    });
});

// Convert categoryCounts into an array of objects as desired
const result = Object.entries(categoryCounts).map(([realm, count]) => ({
    name: realm,  // Realm name becomes the 'name' field for each node
    count: count  // Count is used as the size of the rectangle
}));

// Return the result wrapped in a root node for the treemap
return {
    name: "root",
    children: result  // The 'children' property contains the realms and their counts
};
}

// Updated Function to Create Treemap
function createTreemap(data) {
    const width = 500;  // Width of the treemap
    const height = 300; // Height of the treemap
    
    // 1. Create the root of the hierarchy
    const root = d3.hierarchy(data)  // Use the entire data object directly
      .sum(d => d.count); // The size of each rectangle will be proportional to the count
    
    // 2. Set up the treemap layout
    const treemap = d3.treemap()
      .size([width, height])  // Set the dimensions of the treemap
      .padding(1);  // Space between the nodes
    
    // 3. Apply the treemap layout to the data
    treemap(root);
  
    // 4. Create the SVG element where the treemap will be drawn
    const svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);
  
    // 5. Draw the rectangles for each node
    const cell = svg.selectAll("g")
      .data(root.leaves())  // Get the leaf nodes (actual data nodes)
      .enter().append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);  // Positioning each cell
  
    // 6. Add rectangles to represent each category
    cell.append("rect")
      .attr("width", d => d.x1 - d.x0)  // Width based on the size of the node
      .attr("height", d => d.y1 - d.y0)  // Height based on the size of the node
      .attr("fill", "steelblue")
      .attr("stroke", "white");
  
    // 7. Add labels to the rectangles (optional)
    cell.append("text")
      .attr("x", 5)  // Padding from the left
      .attr("y", 15)  // Padding from the top
      .attr("font-size", "12px")
      .attr("fill", "white")
      .text(d => d.data.name);  // Use the realm name as the label
}
  

