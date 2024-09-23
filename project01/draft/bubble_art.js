
let pets;
let allTypes = [];

// Load both JSON files
Promise.all([
  d3.json('data/cats_art.json'),
  d3.json('data/dogs_art.json')
])
  .then(data => {
    // Combine both arrays
    pets = [...data[0], ...data[1]];
    console.log(pets);
    analyzeData(pets);
    displayData(allTypes);
  });

// Analyze the data
function analyzeData(pets) {
  pets.forEach(n => {
    const type = n.type[0] || n.type[1];
    const topic = n.topic;
    let match = allTypes.find(p => p.name === type);

    if (match) {
      match.count++;
    } else {
      const matchedPets = pets.filter(pet => pet.type[0] === type);
      allTypes.push({
        name: type,
        pet: matchedPets,
        count: matchedPets.length,
        group: topic,
      });
    }
  });

  console.log(allTypes);
}

// display the data
function displayData(allTypes) {
  const width = 1280;
  const height = 720;

  const colors = {
    "Prints": '#B45126',
    "Graphic arts": '#FF603D',
    "Paintings": '#E2B71F',
    "Sculpture": '#48C0DA',
    "Decorative arts": '#CC91D1',
    "Drawings": '#99BB89',
    "Photographs": '#342B71',
    "Exterior views": 'pink',
    "Sheet music": '#B7957C',
    "Folk art": 'teal',
    "Still lifes": 'cyan',
  };

  // Create the pack layout
  const pack = d3.pack()
    .size([width, height])
    .padding(80);

  // Apply the pack layout to the root node
  const root = d3.hierarchy({ children: allTypes })
    .sum(d => d.count);

  pack(root); // This calculates the x, y, and r properties
  console.log("Root data:", root);

  const svg = d3.select("body").append("svg")
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
    const angleStep = (2 * Math.PI) / petCount;

    const groupSelection = svg.append("g")
      .selectAll(null)
      .data(petRoot.leaves())
      .join("g")
      .attr("transform", (d, i) => `translate(${group.x + group.r * Math.cos(i * angleStep)}, ${group.y + group.r * Math.sin(i * angleStep)})`);

    groupSelection.each(function (d) {
      const selection = d3.select(this);
      if (d.data.topic.includes("Cats")) {
        selection.append("rect")
          .attr("width", 16)
          .attr("height", 16)
          .attr("x", -8)
          .attr("y", -8)
          .attr("fill", colors[d.data.type[0]] || 'gray');
      } else if (d.data.topic.includes("Dogs")) {
        selection.append("circle")
          .attr("r", 10)
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
    .text(d => d.data.name)
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
    .text(d => d.data.count)
    .attr("font-size", 14)
    .attr("font-family", "spirits-soft");


  return svg.node();
}