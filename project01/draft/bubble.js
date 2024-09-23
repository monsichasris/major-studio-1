let pets; // Outer pets variable
let allTypes = [];


// Load both JSON files
Promise.all([
  d3.json('data-unit/cat_CHNDM.json'),
  d3.json('data-unit/cat_FSG.json'),
  d3.json('data-unit/cat_HMSG.json'),
  d3.json('data-unit/cat_NPG.json'),
  d3.json('data-unit/cat_SAAM.json'),
  d3.json('data-unit/dog_CHNDM.json'),
  d3.json('data-unit/dog_FSG.json'),
  d3.json('data-unit/dog_HMSG.json'),
  d3.json('data-unit/dog_NPG.json'),
  d3.json('data-unit/dog_SAAM.json')
])
  .then(data => {
    // Combine arrays
    pets = [...data[0], ...data[1], ...data[2], ...data[3], ...data[4], ...data[5], ...data[6], ...data[7], ...data[8], ...data[9]];
    console.log(pets); // Check combined data
    analyzeData(pets); // Call analyzeData function
    displayData(pets); // Call your bubble chart function
  });

// analyze the data
function analyzeData(pets) {
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
  console.log(allTypes);

  // sort by amount of items in the list
  allTypes.sort((a, b) => (a.count < b.count) ? 1 : -1);
  console.log(allTypes)
}

// Display the data in a chart
function displayData(pets) { // Accept pets as a parameter

  // Define dimensions for the graphic
  const width = 2000;
  const height = 700;

  const colors = {
    "Prints": 'red',
    "Graphic arts": 'blue',
    "Paintings": 'green',
    "Sculpture": 'yellow',
    "Decorative arts": 'magenta',
    "Drawings": 'orange',
    "Photographs": 'purple',
    "Exterior views": 'pink',
    "Sheet music": 'brown',
    "Folk art": 'teal',
    "Still lifes": 'cyan',
  }

  // Create an SVG container
  const svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  allTypes.forEach((d, i) => {
    svg.append('circle')
      .attr('cx', 200 + i * (allTypes[i].count + 100))
      .attr('cy', height / 2)
      .attr('r', allTypes[i].count)
      .attr('fill', colors[d.name])
    // .attr('stroke', 'black')
  });

  // // Iterate over the pets array
  // pets.forEach((d, i) => {


  //   // const types = pets.filter((item) => Object.values(item)[0] === type);

  //   // for (let i = 0; i < pets.length; i++) {
  //   //   //assign color for each type
  //   // }

  //   for (let i = 0; i < pets.length; i++) {
  //     //assign the shape for each pet
  //     if (d.topic[i] === 'Cats') {
  //       svg.append('rect')
  //         .attr('x', 30)
  //         .attr('y', i * 30)
  //         .attr('width', 20)
  //         .attr('height', 20)
  //         ;
  //     } else if (d.topic[i] === 'Dogs') {
  //       svg.append('circle')
  //         .attr('cx', 70)
  //         .attr('cy', i * 30)
  //         .attr('r', 10)
  //         ;
  //     }
  //   }
  // });





}