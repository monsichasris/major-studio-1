let state = {
  data: [],
  groupBy: {
    menu: ["preview", "occasion", "colors", "elements", "all"],
    selected: "preview",
  }
}

async function dataLoad() {
    // set up layout
    initializeLayout();
    const data = await d3.json("data/greeting-cards.json");
    
    // copy the data into the state variable, add a unique ID for each object and add the filters
    setState({
      data: data.map((d, i) => ({
        ...d,
        id: d.id, // each object should have a unique ID
      })),
    });

    // Set up the scrollama
    setupScrollama();
  }

// whenever state changes, update the state variable, then redraw the viz
function setState(nextState) {
  // using Object.assign keeps the state *immutable*
  state = Object.assign({}, state, nextState);
}

function setupScrollama() {
  // Initialize the scrollama
  const scroller = scrollama();

  // Generic window resize listener event
  function handleResize() {
    // update height of step elements
    const stepH = Math.floor(window.innerHeight);
    d3.selectAll(".step").style("height", stepH + "px");

    const figureHeight = window.innerHeight;

    d3.select("figure")
      .style("height", figureHeight + "px")

    // tell scrollama to update new element dimensions
    scroller.resize();
  }

  // Scrollama event handlers
  function handleStepEnter(response) {
    console.log(response);

    // Get the step data attribute
    const step = response.element.getAttribute("data-step");
    state.groupBy.selected = step;
  
    // Clear the existing chart content
    d3.select('#chart-container').selectAll('*').remove();

    // Call the appropriate function based on the step
    if (step === "1") {
      state.groupBy.selected = "preview";
      previewImg();
    } else if (step === "2") {
      state.groupBy.selected = "occasion";;
      groupOccasion();
    } else if (step === "3") {
      state.groupBy.selected = "colors";
      groupOccasionColor();
    } else if (step === "4") {
      state.groupBy.selected = "elements";
      groupOccasionElement();
    } else if (step === "5") {
      state.groupBy.selected = "all";
      groupAll();
    }
  }

  // 1. force a resize on load to ensure proper dimensions are sent to scrollama
  // 2. setup the scroller passing options this will also initialize trigger observations
  // 3. bind scrollama event handlers (this can be chained like below)
  handleResize();
  scroller
    .setup({
      step: "#scrolly article .step",
      offset: 0.33,
      debug: false
    })
    .onStepEnter(handleStepEnter);

  // Setup resize event
  window.addEventListener("resize", handleResize);
}
	
async function extractAndSortColors(cards) {
  const imgPaths = cards.map(card => `assets/download_cards/cardImgDownload/${card.id}.jpg`);
  const colorPromises = imgPaths.map(imgPath => Vibrant
    .from(imgPath)
    .getPalette()
    .catch(err => {
      console.error('Error extracting palette:', err);
      return null;
    })
  );

  const palettes = await Promise.all(colorPromises);
  const results = palettes.map((palette, index) => {
    const card = cards[index];
    if (palette && palette.Vibrant) {
      return { color: d3.hsl(palette.Vibrant.getHex()), card };
    } else if (palette && palette.DarkVibrant) {
      return { color: d3.hsl(palette.DarkVibrant.getHex()), card };
    } else if (palette && palette.LightVibrant) {
      return { color: d3.hsl(palette.LightVibrant.getHex()), card };
    } else if (palette && palette.DarkMuted) {
      return { color: d3.hsl(palette.DarkMuted.getHex()), card };
    } else if (palette && palette.LightMuted) {
      return { color: d3.hsl(palette.LightMuted.getHex()), card };
    } else {
      return { color: d3.hsl('#cccccc'), card }; // Fallback color
    }
  });

  // Sort colors by hue
  results.sort((a, b) => ((a.color.h + 360) % 360) - ((b.color.h + 360) % 360));
  return results;
}

//ensures that the function is not called too frequently
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// sets up before data loads
function initializeLayout() {

d3.select('figure')
    .append('div')
    .attr('id', 'chart-container');
  
}

// Display all images preview grid on screen
function previewImg() {

  const grid = d3.select('#chart-container')
    .style('padding', '0')
    .append('div')
    .attr('class', 'grid');

  // Shuffle the cards array to display images in random order
  const shuffledCards = d3.shuffle(state.data);

  shuffledCards.forEach((card, index) => {
      const img = grid.append('img')
          .attr('src', card.img_preview)
          .attr('width', 72)
          .attr('height', 72)
          .attr('z-index', -100)
          .style('opacity', 0)
          .style('transition', 'opacity 10s');

      // Randomly decide if the image should hold 0 opacity longer
      const holdOpacity = Math.random() < 0.98;
      const delay = holdOpacity ? Math.random() * 10000 : Math.random() * 100;

      // Transition to 100% opacity one by one
      setTimeout(() => {
          img.style('opacity', 1);
      }, delay);
  });
}

// Sort occasions by number of cards and put "Other" at the end
function sortOccasions(occasions) {
  return Array.from(occasions).sort((a, b) => {
    if (a[0] === "Other") return 1;
    if (b[0] === "Other") return -1;
    return b[1].length - a[1].length;
  });
}

function groupOccasion() {
  const occasions = d3.group(state.data, d => d.occasion);
  const sortedOccasions = sortOccasions(occasions);

  sortedOccasions.forEach(([key, value]) => {
    const occasionContainer = d3.select('#chart-container').style('padding','40px')
    .append('div')
    .attr('class', 'occasion');

    const groupTitle = occasionContainer.append('div').attr('class', 'group-title');
      groupTitle.append('h3').text(key);
      groupTitle.append('text').text(value.length + ' cards');

    const cards = occasionContainer.append('div').attr('class', 'row');
    value.forEach((card, index) => {
      const img = cards.append('img')
      .attr('src', card.img_preview)
      .attr('width', 5)
      .attr('height', 48)
      .style('transition', 'width 0.3s ease');

      img.on('mouseover', function() {
      d3.select(this).attr('width', 80);
      });

      img.on('mouseout', function() {
      d3.select(this).attr('width', 5);
      });

      img.on('click', function() {
        showCardModal(card);
      });
    });
  });
}

// Group data by occasion but show color from vibrant.js instead of images
async function groupOccasionColor() {
  const occasions = d3.group(state.data, d => d.occasion);
  const sortedOccasions = sortOccasions(occasions);

  for (const [key, value] of sortedOccasions) {
    const occasionContainer = d3.select('#chart-container').append('div').attr('class', 'occasion');

    const groupTitle = occasionContainer.append('div').attr('class', 'group-title');
    groupTitle.append('h3').text(key);
    groupTitle.append('text').text(value.length + ' cards');

    const cards = occasionContainer.append('div').attr('class', 'row');

    const results = await extractAndSortColors(value);
    results.forEach(({ color, card }) => {
      const swatch = cards.append('div')
      .attr('class', 'swatch')
      .style('background-color', color.toString())
      .style('width', '4px')
      .style('height', '48px')
      .style('display', 'inline-block')
      .style('transition', 'width 0.3s ease');

      swatch.on('mouseover', function() {
      d3.select(this)
        .style('width', '80px')
        .style('background-image', `url(${card.img_preview})`)
        .style('background-size', 'cover');
      });

      swatch.on('mouseout', function() {
      d3.select(this)
        .style('width', '4px')
        .style('background-image', 'none');
      });

      swatch.on('click', function() {
        showCardModal(card);
      });
    });
  }
}

// Group data by occasion and elements
function groupOccasionElement() {
  const occasions = d3.group(state.data, d => d.occasion);
  const sortedOccasions = sortOccasions(occasions);

  sortedOccasions.forEach(([key, value]) => {
    const elements = value.map(card => card.elements).flat();
    const uniqueElements = [...new Set(elements)];

    const occasionContainer = d3.select('#chart-container').append('div').attr('class', 'occasion');

    const groupTitle = occasionContainer.append('div').attr('class', 'group-title');
    groupTitle.append('h3').text(key);
    groupTitle.append('text').text(value.length + ' cards');

    const cards = occasionContainer.append('div')
      .attr('class', 'row')
      .style('display', 'flex')
      .style('flex-wrap', 'wrap');

    uniqueElements.forEach(element => {
      const elementContainer = cards.append('div').attr('class', 'element');
      elementContainer.append('text')
        .text(element)
        .style('font-size', '10px')
        .style('transform', 'rotate(-90deg) translate(0, 1.5rem)')
        .style('margin', '0')
        .style('alignment-baseline', 'baseline');
      const elementImgContainer = elementContainer.append('div').attr('class', 'row');
      value.forEach(card => {
        if (card.elements.includes(element)) {
          const img = elementImgContainer.append('img')
            .attr('src', card.img_preview)
            .attr('width', 2.3)
            .attr('height', 48)
            .style('transition', 'width 0.3s ease');

          img.on('mouseover', function() {
            d3.select(this).attr('width', 80);
          });

          img.on('mouseout', function() {
            d3.select(this).attr('width', 2.3);
          });

          img.on('click', function() {
            showCardModal(card);
          });
        }
      });
    });
  });
}

// Group all data by occasion and elements
async function groupAll() {
  const occasions = d3.group(state.data, d => d.occasion);
  const sortedOccasions = sortOccasions(occasions);

  for (const [key, value] of sortedOccasions) {
    const elements = value.map(card => card.elements).flat();
    const uniqueElements = [...new Set(elements)];
    const occasionContainer = d3.select('#chart-container').append('div').attr('class', 'occasion');

    const groupTitle = occasionContainer.append('div').attr('class', 'group-title');
    groupTitle.append('h3').text(key);
    groupTitle.append('text').text(value.length + ' cards');

    const cards = occasionContainer.append('div').attr('class', 'row');

    for (const element of uniqueElements) {
      const elementContainer = cards.append('div').attr('class', 'element');
      elementContainer.append('text')
      .text(element)
      .style('font-size', '10px')
      .style('transform', 'rotate(-90deg) translate(0, 1.5rem)')
      .style('margin', '0')
      .style('alignment-baseline', 'baseline');
      const elementImgContainer = elementContainer.append('div').attr('class', 'row');

      const elementCards = value.filter(card => card.elements.includes(element));
      const results = await extractAndSortColors(elementCards);
      results.forEach(({ color, card }) => {
        const swatch = elementImgContainer.append('div')
          .attr('class', 'swatch2')
          .style('background-color', color.toString())
          .style('width', '4px')
          .style('height', '48px')
          .style('display', 'inline-block')
          .style('transition', 'width 0.3s ease');

        swatch.on('mouseover', function() {
          d3.select(this)
        .style('width', '80px')
        .style('background-image', `url(${card.img_preview})`)
        .style('background-size', 'cover');
        });

        swatch.on('mouseout', function() {
          d3.select(this)
        .style('width', '4px')
        .style('background-image', 'none');
        });

        swatch.on('click', function() {
          showCardModal(card);
        });

      });
    }
  }
}

// Function to show the cards in popup modal when clicked on the image
function showCardModal(card) {
  // Remove any existing modal
  d3.select('.modal').remove();

  // Create the modal
  const modal = d3.select('body').append('div').attr('class', 'modal');
  modal.html(`
    <div class="modal-content">
      <span class="close">&times;</span>
      <img src="${card.img_preview}" width="300">
      <h3>${card.occasion}</h3>
      <p>${card.elements.join(', ')}</p>
    </div>
  `);
  modal.style('display', 'block');
  
  // // Add color swatches using Vibrant.js
  // Vibrant.from(card.img_preview).getPalette().then(palette => {
  //   const swatches = modal.select('.modal-content').append('div').attr('class', 'swatches');
  //   Object.values(palette).forEach(swatch => {
  //     if (swatch) {
  //       swatches.append('div')
  //         .style('background-color', swatch.getHex())
  //         .style('width', '20px')
  //         .style('height', '20px')
  //         .style('display', 'inline-block')
  //         .style('margin', '2px');
  //     }
  //   });
  // }).catch(err => {
  //   console.error('Error extracting palette:', err);
  // });

  // Close the modal when the close button is clicked
  const span = document.querySelector('.close');
  span.onclick = function() {
    modal.style('display', 'none');
  }

  // Close the modal when clicking outside of the modal content
  window.onclick = function(event) {
    if (event.target == modal.node()) {
      modal.style('display', 'none');
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  dataLoad();
});