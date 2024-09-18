let pets;
let allTypes = [];

// load the data
d3.json('data/cats_art.json' || 'data/dogs_art.json')
  .then(data => {
    pets = data;
    analyzeData();
    displayData();
  });


// analyze the data
function analyzeData() {
  let type;

  // go through the list of textiles
  pets.forEach(n => {
    type = n.type[0];
    let match = false;

    // see if their location already exists the allTypes array
    allTypes.forEach(p => {
      if (p.name == type) {
        p.count++;
        match = true;
      }
    });
    // if not create a new entry for that place name
    if (!match) {
      allTypes.push({
        name: type,
        count: 1
      });
    }
  });

  // sort by amount of items in the list
  allTypes.sort((a, b) => (a.count < b.count) ? 1 : -1);
  console.log(allTypes);

  // display the data in bubble chart
  //reference: https://observablehq.com/@mbostock/clustered-bubbles
  var bubbleChart = function () {
    const width = 800;
    const height = 600;
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Define the pack layout
    const pack = d3.pack()
      .size([width, height])
      .padding(1);

    // Create the root hierarchy
    const root = d3.hierarchy({ children: allTypes })
      .sum(d => d.count);

    // Compute the pack layout
    pack(root);

    // Create the SVG container
    const svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);

    // Append circles for grouped data
    if (grouped) {
      svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .selectAll("circle")
        .data(root.descendants().filter(d => d.height === 1))
        .join("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.r);
    }

    // Append circles for leaf nodes
    svg.append("g")
      .selectAll("circle")
      .data(root.leaves())
      .join("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.r)
      .attr("fill", d => color(d.data.name));

    return svg.node();
  }

  pack = () => d3.pack()
    .size([width, height])
    .padding(1)
    (d3.hierarchy(data)
      .sum(d => d.value))

  data = ({
    children: Array.from(
      d3.group(
        Array.from({ length: n }, (_, i) => ({
          group: Math.random() * m | 0,
          value: -Math.log(Math.random())
        })),
        d => d.group
      ),
      ([, children]) => ({ children })
    )
  })

  color = d3.scaleOrdinal(d3.range(m), d3.schemeCategory10)

  d3 = require("d3@5", "d3-array@2")
}