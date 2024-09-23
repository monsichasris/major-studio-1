let pets;
let allTypes = [];

// Load both JSON files
Promise.all([
  d3.json('data-unit/cat_CHNDM.json').then(data => data.map(d => ({ ...d, source: 'cat_CHNDM' }))),
  d3.json('data-unit/cat_FSG.json').then(data => data.map(d => ({ ...d, source: 'cat_FSG' }))),
  d3.json('data-unit/cat_HMSG.json').then(data => data.map(d => ({ ...d, source: 'cat_HMSG' }))),
  d3.json('data-unit/cat_NMAfA.json').then(data => data.map(d => ({ ...d, source: 'cat_NMAfA' }))),
  d3.json('data-unit/cat_NPG.json').then(data => data.map(d => ({ ...d, source: 'cat_NPG' }))),
  d3.json('data-unit/cat_SAAM.json').then(data => data.map(d => ({ ...d, source: 'cat_SAAM' }))),
  d3.json('data-unit/dog_CHNDM.json').then(data => data.map(d => ({ ...d, source: 'dog_CHNDM' }))),
  d3.json('data-unit/dog_FSG.json').then(data => data.map(d => ({ ...d, source: 'dog_FSG' }))),
  d3.json('data-unit/dog_HMSG.json').then(data => data.map(d => ({ ...d, source: 'dog_HMSG' }))),
  d3.json('data-unit/dog_NMAfA.json').then(data => data.map(d => ({ ...d, source: 'dog_NMAfA' }))),
  d3.json('data-unit/dog_NPG.json').then(data => data.map(d => ({ ...d, source: 'dog_NPG' }))),
  d3.json('data-unit/dog_SAAM.json').then(data => data.map(d => ({ ...d, source: 'dog_SAAM' })))
])
  .then(data => {
    // Combine arrays
    pets = [...data[0], ...data[1], ...data[2], ...data[3], ...data[4], ...data[5], ...data[6], ...data[7], ...data[8], ...data[9], ...data[10], ...data[11]];
    console.log(pets); // Check combined data

    // Get the number of elements where d.data.source starts with "dog"
    const dogCount = pets.filter(pet => pet.source.startsWith("dog")).length;
    console.log(`Number of elements where source starts with "dog": ${dogCount}`);

    // Get the number of elements where d.data.source starts with "cat"
    const catCount = pets.filter(pet => pet.source.startsWith("cat")).length;
    console.log(`Number of elements where source starts with "cat": ${catCount}`);

    // Group the data by type
    const groupedByType = d3.group(pets, d => d.type[0]);

    // Get the number of elements where d.data.source starts with "dog" grouped by type
    const dogCountsByType = Array.from(groupedByType, ([type, items]) => ({
      type,
      count: items.filter(pet => pet.source.startsWith("dog")).length
    }));
    dogCountsByType.sort((a, b) => b.count - a.count);
    console.log("Dog counts by type:", dogCountsByType);

    // Get the number of elements where d.data.source starts with "cat" grouped by type
    const catCountsByType = Array.from(groupedByType, ([type, items]) => ({
      type,
      count: items.filter(pet => pet.source.startsWith("cat")).length
    }));
    catCountsByType.sort((a, b) => b.count - a.count);
    console.log("Cat counts by type:", catCountsByType);

    analyzeData(pets); // Call analyzeData function
    displayData(pets); // Call your bubble chart function
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
  // Sort the allTypes array in descending order based on count
  allTypes.sort((a, b) => b.count - a.count);

  console.log(allTypes);
}

// display the data
function displayData(pets) {
  const width = window.innerWidth;
  const height = width * 0.8;

  // Create the pack layout
  const pack = d3.pack()
    .size([width, height])
    .padding(40);

  // Apply the pack layout to the root node
  const root = d3.hierarchy({ children: allTypes })
    .sum(d => d.count || 1);

  pack(root); // This calculates the x, y, and r properties
  console.log("Root data:", root);

  const svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height);

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
    .style("font-family", "spirits-soft")
    .style("font-weight", "light");

  // Append circles for grouped data
  svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "#ccc")
    .selectAll("circle")
    .data(root.leaves())
    .join("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.r);

  //Append circles for each object in each group based on count
  root.leaves().forEach(group => {
    const petCount = group.data.pet.length;
    const radius = group.r;
    const padding = 40; // Padding between circles

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
      .attr("transform", (d, i) => `translate(${group.x - radius + d.x}, ${group.y - radius + d.y})`);

    groupSelection.each(function (d) {
      const selection = d3.select(this);
      //Check for topic Property and display the shape based on the topic
      if (d.data.source && d.data.source.startsWith("cat")) {
        selection.append("rect")
          .attr("width", 12)
          .attr("height", 12)
          .attr("x", -6)
          .attr("y", -6)
          .attr("fill", '#48C0DA')
          .on("mouseover", function () {
            d3.select(this)
              .attr("width", 14)
              .attr("height", 14)
              .attr("x", -7)
              .attr("y", -7);
          })
          .on("mouseout", function () {
            d3.select(this)
              .attr("width", 12)
              .attr("height", 12)
              .attr("x", -6)
              .attr("y", -6);
          });
      } else if (d.data.source && d.data.source.startsWith("dog")) {
        selection.append("circle")
          .attr("r", 6)
          .attr("fill", '#FF603D')
          .on("mouseover", function () {
            d3.select(this).attr("r", 7);
          })
          .on("mouseout", function () {
            d3.select(this).attr("r", 6);
          });
      }
    });

    groupSelection
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible")
          .html(`Find the ${d.data.source.slice(0, 3)} in <br>
          <b>${d.data.title}</b><br>
          They live in the form of ${d.data.type[0]}<br>`) // Use .html() to include HTML tags
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

  // Add text for each group
  svg.append("g")
    .selectAll("text")
    .data(root.leaves())
    .join("text")
    .attr("x", d => d.x)
    .attr("y", d => d.y - d.r)
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
    .attr("y", d => d.y + d.r)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .text(d => {
      //if the count is greater than 50, display the text
      if (d.data.count > 30) {
        return d.data.count;
      }
      return '';
    })
    .attr("font-size", 14)
    .attr("font-family", "spirits-soft");

  return svg.node();
}