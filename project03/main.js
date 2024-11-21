let state = {
  data: [],
  groupBy: {
    menu: ["preview", "occasion", "colors", "elements", "all"],
    selected: "preview",
  }
}

async function dataLoad() {
    // we can set up our layout before we have data
    initializeLayout();
    const data = await d3.json("data/greeting-cards.json");
    
    // copy the data into the state variable, add a unique ID for each object and add the filters
    setState({
      data: data.map((d, i) => ({
        ...d,
        id: d.id, // each object should have a unique ID
      })),
    });

    // Call the initial grouping function based on the selected value
    onRadioChange({ target: { value: state.groupBy.selected } });
  }

// whenever state changes, update the state variable, then redraw the viz
function setState(nextState) {
  // using Object.assign keeps the state *immutable*
  state = Object.assign({}, state, nextState);
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

function onRadioChange(event) {
  const selectedValue = event.target.value;
  state.groupBy.selected = selectedValue;

  // Clear the existing chart content
  d3.select('#chart-container').selectAll('*').remove();

  // Call the appropriate function based on the selected value
  if (selectedValue === 'occasion') {
      groupOccasion();
  } else if (selectedValue === 'colors') {
      groupOccasionColor();
  } else if (selectedValue === 'elements') {
      groupOccasionElement();
  } else if (selectedValue === 'preview') {
      previewImg();
  } else if (selectedValue === 'all') {
      groupAll();
  }
}

//ensures that the function is not called too frequently
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const debouncedOnRadioChange = debounce(onRadioChange, 300);

// this function sets up everything we can before data loads
function initializeLayout() {

  const chartSection = d3.select('#chart');
  const rightMenu = chartSection.append('div').attr('class', 'right-menu').style('position', 'relative');
  const chart = chartSection.append('div').attr('id', 'chart-container');
  
  // Add radio buttons to the right menu
  const form = document.createElement('form');
  form.innerHTML = state.groupBy.menu
    .map(
      d =>
        `<input type="radio" name="groupby" value="${d}" ${
          state.groupBy.selected === d ? "checked" : ""
        }>${d}<br>`
    )
    .join("");
  form.addEventListener("change", debouncedOnRadioChange);
  rightMenu.node().appendChild(form);

  // Add a legend to the right menu
  const legend = document.createElement('div');
  legend.className = 'legend';
  rightMenu.node().appendChild(legend);

  // Set up initial styles
  chart.style.flex = '1';
  rightMenu.style.width = '200px';
  rightMenu.style.padding = '1em';
  rightMenu.style.backgroundColor = '#f1f1f1';
}

// Display all images preview grid on screen
function previewImg() {
  const grid = d3.select('#chart-container').append('div').attr('class', 'grid');

  // Shuffle the cards array to display images in random order
  const shuffledCards = d3.shuffle(state.data);

  shuffledCards.forEach((card, index) => {
      const img = grid.append('img')
          .attr('src', card.img_preview)
          .attr('width', 48)
          .attr('height', 48)
          .attr('z-index', 0)
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

// Group data by occasion
function groupOccasion() {
  const occasions = d3.group(state.data, d => d.occasion);
  occasions.forEach((value, key) => {
      const occasionContainer = d3.select('#chart-container').append('div').attr('class', 'occasion');
      occasionContainer.append('h3').text(key);
      occasionContainer.append('text').text('Number of cards: ' + value.length);
      const grid = occasionContainer.append('div').attr('class', 'row');
      value.forEach((card, index) => {
          grid.append('img')
              .attr('src', card.img_preview)
              .attr('width', 5)
              .attr('height', 48);
      });
  });
}

// Example groupOccasionElement function
function groupOccasionElement() {
  const occasions = d3.group(state.data, d => d.occasion);
  occasions.forEach((value, key) => {
    const elements = value.map(card => card.elements).flat();
    const uniqueElements = [...new Set(elements)];
    console.log(uniqueElements);
    const occasionContainer = d3.select('#chart-container').append('div').attr('class', 'occasion');
    occasionContainer.append('h3').text(key);
    const grid = occasionContainer.append('div').attr('class', 'row');

    uniqueElements.forEach(element => {
      const elementContainer = grid.append('div').attr('class', 'element');
      elementContainer.append('text').text(element);
      const elementImgContainer = elementContainer.append('div').attr('class', 'row');
      value.forEach(card => {
        if (card.elements.includes(element)) {
          elementImgContainer.append('img')
            .attr('src', card.img_preview)
            .attr('width', 5)
            .attr('height', 48);
        }
      });
    });
  });
}

// Group data by occasion but show color from vibrant.js instead of images
async function groupOccasionColor() {
  const occasions = d3.group(state.data, d => d.occasion);
  for (const [key, value] of occasions) {
    const occasionContainer = d3.select('#chart-container').append('div').attr('class', 'occasion');
    occasionContainer.append('h3').text(key);
    const grid = occasionContainer.append('div').attr('class', 'row');

    const results = await extractAndSortColors(value);
    results.forEach(({ color }) => {
      grid.append('div').attr('class', 'swatch').style('background-color', color.toString());
    });
  }
}

// Group all data by occasion and elements
async function groupAll() {
  const occasions = d3.group(state.data, d => d.occasion);
  for (const [key, value] of occasions) {
    const elements = value.map(card => card.elements).flat();
    const uniqueElements = [...new Set(elements)];
    const occasionContainer = d3.select('#chart-container').append('div').attr('class', 'occasion');
    occasionContainer.append('h3').text(key);
    const grid = occasionContainer.append('div').attr('class', 'row');

    for (const element of uniqueElements) {
      const elementContainer = grid.append('div').attr('class', 'element');
      elementContainer.append('text').text(element);
      const elementImgContainer = elementContainer.append('div').attr('class', 'row');

      const elementCards = value.filter(card => card.elements.includes(element));
      const results = await extractAndSortColors(elementCards);
      results.forEach(({ color }) => {
        elementImgContainer.append('div').attr('class', 'swatch').style('background-color', color.toString());
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  dataLoad();
});