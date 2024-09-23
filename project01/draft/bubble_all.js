let pets;
let allTypes = [];

// Load both JSON files
Promise.all([
  d3.json('data/cats.json'),
  d3.json('data/dogs.json')
])
  .then(data => {
    // Combine both arrays
    pets = [...data[0], ...data[1]];
    console.log(pets); // Check combined data
    analyzeData(pets); // Call analyzeData function
    displayData(allTypes); // Call your bubble chart function
  });

// Analyze the data
function analyzeData(pets) {
  pets.forEach(n => {
    const type = n.type[0];
    let match = allTypes.find(p => p.name === type);

    if (match) {
      match.count++;
    } else {
      const matchedPets = pets.filter(pet => pet.type[0] === type);
      allTypes.push({
        name: type,
        pet: matchedPets,
        count: matchedPets.length
      });
    }
  });

  console.log(allTypes);
}

// display the data
function displayData(allTypes) {
  const width = 1280;
  const height = 720;

  const colors = d3.scaleOrdinal(d3.schemeAccent);

  // Create the pack layout
  const pack = d3.pack()
    .size([width, height])
    .padding(8);

  // Apply the pack layout to the root node
  const root = d3.hierarchy({ children: allTypes })
    .sum(d => d.count);

  pack(root); // This calculates the x, y, and r properties
  console.log("Root data:", root);

  const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

  // // Append circles for grouped data
  // let grouped = true;
  // if (grouped) {
  //   svg.append("g")
  //     .attr("fill", "none")
  //     .attr("stroke", "#ccc")
  //     .selectAll("circle")
  //     .data(root.leaves())
  //     .join("circle")
  //     .attr("cx", d => d.x)
  //     .attr("cy", d => d.y)
  //     .attr("r", d => d.r);
  // }

  // Append circles for leaf nodes

  // svg.append("g")
  //   .selectAll("circle")
  //   .data(root.leaves())
  //   .join("circle")
  //   .attr("cx", d => d.x)
  //   .attr("cy", d => d.y)
  //   .attr("r", d => 10)
  //   .attr("fill", d => {
  //     console.log("Node data:", d.data); // Log each node's data
  //     return colors[d.data.name] || 'gray';
  //   });

  // Random layout
  // root.leaves().forEach(group => {
  //   svg.append("g")
  //     .selectAll("circle")
  //     .data(group.data.pet) // Use the pets array inside each group
  //     .join("circle")
  //     .attr("cx", d => group.x + Math.random() * group.r * 2 - group.r) // Randomize position within the group's radius
  //     .attr("cy", d => group.y + Math.random() * group.r * 2 - group.r) // Randomize position within the group's radius
  //     .attr("r", d => 10) // Fixed radius for each object
  //     .attr("fill", d => {
  //       console.log("Node data:", d); // Log each node's data
  //       return colors[d.type[0]] || 'gray';
  //     });
  // });

  // Circular layout
  // root.leaves().forEach(group => {
  //   const petCount = group.data.pet.length;
  //   const radius = group.r;
  //   const angleStep = (2 * Math.PI) / petCount;

  //   svg.append("g")
  //     .selectAll("circle")
  //     .data(group.data.pet) // Use the pets array inside each group
  //     .join("circle")
  //     .attr("cx", (d, i) => group.x + radius * Math.cos(i * angleStep)) // Position in a circular layout
  //     .attr("cy", (d, i) => group.y + radius * Math.sin(i * angleStep)) // Position in a circular layout
  //     .attr("r", d => 10) // Fixed radius for each object
  //     .attr("fill", d => {
  //       console.log("Node data:", d); // Log each node's data
  //       return colors[d.type[0]] || 'gray';
  //     });
  // });

  // Grid layout
  // root.leaves().forEach(group => {
  //   const petCount = group.data.pet.length;
  //   const radius = group.r;
  //   const gridSize = Math.ceil(Math.sqrt(petCount)); // Calculate grid size
  //   const cellSize = (2 * radius) / gridSize; // Calculate cell size

  //   svg.append("g")
  //     .selectAll("circle")
  //     .data(group.data.pet) // Use the pets array inside each group
  //     .join("circle")
  //     .attr("cx", (d, i) => {
  //       const col = i % gridSize;
  //       return group.x - radius + col * cellSize + cellSize / 2;
  //     })
  //     .attr("cy", (d, i) => {
  //       const row = Math.floor(i / gridSize);
  //       return group.y - radius + row * cellSize + cellSize / 2;
  //     })
  //     .attr("r", d => 10) // Fixed radius for each object
  //     .attr("fill", d => {
  //       console.log("Node data:", d); // Log each node's data
  //       return colors[d.type[0]] || 'gray';
  //     });
  // });


  // // Append circles for each object in each group based on count
  // root.leaves().forEach(group => {
  //   const petCount = group.data.pet.length;
  //   const radius = group.r;
  //   const padding = 5; // Padding between circles

  //   // Create a pack layout for the group
  //   const pack = d3.pack()
  //     .size([radius * 2, radius * 2])
  //     .padding(padding);

  //   // Create a hierarchy for the pets
  //   const petHierarchy = d3.hierarchy({ children: group.data.pet })
  //     .sum(() => 1);

  //   // Apply the pack layout to the pet hierarchy
  //   const petRoot = pack(petHierarchy);

  //   svg.append("g")
  //     .selectAll("circle")
  //     .data(petRoot.leaves()) // Use the packed layout for the pets
  //     .join("circle")
  //     .attr("cx", d => group.x - radius + d.x) // Adjust position relative to the group
  //     .attr("cy", d => group.y - radius + d.y) // Adjust position relative to the group
  //     .attr("r", d => d.r) // Use the radius from the pack layout
  //     .attr("fill", d => colors[d.data.count] || 'gray');
  // });

  // Create tooltip element
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "#fff")
    .style("box-shadow", "0 0 4px rgba(0,0,0,0.2)")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("font-family", "spirits-soft");


  //Append circles for each object in each group based on count
  root.leaves().forEach(group => {
    const petCount = group.data.pet.length;
    const radius = group.r;
    const padding = 2; // Padding between circles

    // Create a pack layout for the group
    const pack = d3.pack()
      .size([radius * 2, radius * 2])
      .padding(padding);

    // Create a hierarchy for the pets
    const petHierarchy = d3.hierarchy({ children: group.data.pet })
      .sum(() => 1);

    // Apply the pack layout to the pet hierarchy
    const petRoot = pack(petHierarchy);

    const groupSelection = svg.append("g")
      .selectAll(null)
      .data(petRoot.leaves())
      .join("g")
      .attr("cx", d => group.x - radius + d.x) // Adjust position relative to the group
      .attr("cy", d => group.y - radius + d.y) // Adjust position relative to the group
      .attr("r", d => d.r) // Use the radius from the pack layout
      .attr("transform", (d, i) => `translate(${group.x - group.r + d.x}, ${group.y - group.r + d.y})`);

    groupSelection.each(function (d) {
      const selection = d3.select(this);
      if (d.data.topic.includes("Cats")) {
        selection.append("rect")
          .attr("width", 8)
          .attr("height", 8)
          .attr("x", -4)
          .attr("y", -4)
          .attr("fill", colors[d.data.type[0]] || 'gray');
      } else if (d.data.topic.includes("Dogs")) {
        selection.append("circle")
          .attr("r", 4)
          .attr("fill", colors[d.data.type[0]] || 'gray');
      }
    });

    groupSelection
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible")
          .text(`${d.data.title}`)
          .style("width", "120px")
          .append("img")
          .attr("src", d.data.thumbnail)
          .attr("width", 120)
          .style("display", "block")
        d3.select(event.currentTarget).style("cursor", "pointer");

      })

      .on("mousemove", event => {
        tooltip.style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("click", (event, d) => {
        window.location.href = d.data.link;
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

  });



  svg.append("g")
    .selectAll("text")
    .data(root.leaves())
    .join("text")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .text(d => {
      //if the count is greater than 50, display the text
      if (d.data.count > 30) {
        return d.data.name;
      }
      return '';
    })
    .attr("font-size", 14)
    .attr("font-family", "spirits-soft");

  svg.append("g")
    .selectAll("text")
    .data(root.leaves())
    .join("text")
    .attr("x", d => d.x)
    .attr("y", d => d.y + 20)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .text(d => {
      //if the count is greater than 50, display the text
      if (d.data.count > 50) {
        return d.data.count;
      }
      return '';
    })
    .attr("font-size", 14)
    .attr("font-family", "spirits-soft");



  return svg.node();
}