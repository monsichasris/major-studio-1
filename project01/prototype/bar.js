//reference: https://github.com/visualizedata/major-studio-1-fa24/tree/5f7cc6893e0320fb067efad27c564968142981a0/lab02_smithsonian_api

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

  // go through the list
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
    // if not create a new entry for that type
    if (!match) {
      allTypes.push({
        name: type,
        count: 1
      });
    }
  });

  // sort by amount of items in the list
  allTypes.sort((a, b) => (a.count < b.count) ? 1 : -1);
  console.log(allTypes)
}

// display the data in a bar chart
function displayData() {

  // define dimensions and margins for the graphic
  const margin = ({ top: 100, right: 50, bottom: 100, left: 80 });
  const width = 1400;
  const height = 700;

  // let's define our scales.
  // yScale corresponds with amount of pets per artwork types
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(allTypes, d => d.count)])
    .range([height - margin.bottom, margin.top]);

  // xScale corresponds with type names
  const xScale = d3.scaleBand()
    .domain(allTypes.map(d => d.name))
    .range([margin.left, width - margin.right]);

  // interpolate colors
  const sequentialScale = d3.scaleSequential()
    .domain([0, d3.max(allTypes, d => d.count)])
    .interpolator(d3.interpolateRgb("purple", "orange"));

  // create an svg container from scratch
  const svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);


  // attach a graphic element, and append rectangles to it
  svg.append('g')
    .selectAll('rect')
    .data(allTypes)
    .join('rect')
    .attr('x', d => { return xScale(d.name) })
    .attr('y', d => { return yScale(d.count) })
    .attr('height', d => { return yScale(0) - yScale(d.count) })
    .attr('width', d => { return xScale.bandwidth() - 2 })
    .style('fill', d => { return sequentialScale(d.count); });


  // Axes
  // Y Axis
  const yAxis = d3.axisLeft(yScale).ticks(5)

  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(yAxis);

  // X Axis
  const xAxis = d3.axisBottom(xScale).tickSize(0);

  svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .selectAll('text')
    // .style('text-anchor', 'end')
    .attr('dx', '0')
    .attr('dy', '1em')
    // .attr('transform', d => { return 'rotate(0)' })
    ;

}