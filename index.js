'use strict';

const POWERBALL_URL = 'https://data.ny.gov/api/views/d6yy-54nr/rows.json';
const MEGAMILLIONS_URL = 'https://data.ny.gov/api/views/5xaw-6ayf/rows.json';
const POWERBALL = "Powerball";
const MEGAMILLIONS = "MegaMillions";

const STORE = {
    drawings: [],
}

//// API functions //////////////////////////////////////////////////////////////////////////////////////////////////

function getLotteryDataFromApi() {
    getPowerballDataFromApi(function(response) {
        const powerBallDrawings = powerBallAdapter(response.data);
        STORE.drawings.push(...powerBallDrawings.slice(powerBallDrawings.length - 8));                      
        
        getMegaMillionsDataFromApi(function(response) {
        const megaMillionsDrawings = megaMillionsAdapter(response.data)
        STORE.drawings.push(...megaMillionsDrawings.slice(megaMillionsDrawings.length - 8));    
        
        displayMainPage(STORE.drawings, STORE.newsItems);
        });
    });
}

function getPowerballDataFromApi(success, error) {
    getDataFromApi(POWERBALL_URL, success, error);
}

function getMegaMillionsDataFromApi(success, error) {
    getDataFromApi(MEGAMILLIONS_URL, success, error);
}

function getDataFromApi(url, success, error) {
    const settings = {
        url, 
        type: 'GET',
        dataType: 'json',
        success,
        error,
    }
    $.ajax(settings);
}

function splitDrawingsByName(drawings) {
    let splitDrawings = {};
    for (let i = 0; i < drawings.length; i++) {
      if (drawings[i].name in splitDrawings) {
        splitDrawings[drawings[i].name].push(drawings[i]);
      } else {
        splitDrawings[drawings[i].name] = [drawings[i]];
      }
    }
    return splitDrawings;
}

// need to reverse the numbers array
function megaMillionsAdapter(drawings) {
    const dateIndex = 8;
    const numbersIndex = 9;
    const megaBallIndex = 10;
    const multiplierIndex = 11;
    return drawings.map((drawing) => {
       console.log('multiplier', drawing[multiplierIndex])
        const megaBallMultiplier = [drawing[megaBallIndex], drawing[multiplierIndex]];
        const numbers = drawing[numbersIndex].split(" ")
        numbers.push(...megaBallMultiplier)
            return {
            name: MEGAMILLIONS,
            date: new Date(drawing[dateIndex]),
            numbers
        }
    }).reverse();
}

function powerBallAdapter(drawings) {
    const dateIndex = 8;
    const numbersIndex = 9;
    const multiplierIndex = 10;
    return drawings.map((drawing) => {
        const numbers = drawing[numbersIndex].split(" ")
        numbers.push(drawing[multiplierIndex])
        return {
                name: POWERBALL,
                date: new Date(drawing[dateIndex]),   
                numbers
        }
    }).reverse();
}

////////////// countdown ///////////////

function findNextDrawing(drawingName, date) {
    const today = new Date();
    if (date.getDay() === today.getDay()) {
        return today;
    }
    let nextDay = 0;
    const lastDay = date.getDay();
    switch (drawingName) {
        case POWERBALL:
            if (lastDay === 6) {
                nextDay = 3;
            }
            else if (lastDay === 3) {
                nextDay = 6;
            }
            break;   
        case MEGAMILLIONS:
            if (lastDay === 5) {
                nextDay = 2;
            }
            else if (lastDay === 2) {
                nextDay = 5;
            }
            break;
            default: 
        return today;
    }
    while(date.getDay() !== nextDay ) {
        date = new Date(date.setDate(date.getDate() + 1));
    }
    return date;
}

/////// HISTORY //////////////////////////////////////////////////////////////////////////////////////////////////////

function generateHistorySection(drawingName, drawings) {
    return `
        <section role="region" class="${drawingName.toLowerCase()}historysection hidden">    
          <h3>${drawingName} History</h3>
          <br>
            <ul class="historystyle">
                ${drawings.map(generateHistoryItem).join("\n")}
            </ul>
          <br>
            <a id="historyexit" class="historyexitstyle"><h3>Exit</h3></a>
         <section>
    `
}

function generateHistoryItem(drawing) {
    const region = "en-US";
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long", 
        day: "numeric",  
    }
    return `
    <li class="historyitemstyle">
        <h3>${drawing.date.toLocaleDateString(region, options)}</h3>
             ${generateNumbersList(drawing.numbers, drawing.name)}
    </li>
    `
}

////// GENERATE  //////////////////////////////////////////////////////////////////////////////////////////////////////

function generateNumbersList(numbers, drawingName) {
    const numberList = numbers.map(number => { return `<li class="numberitem">${number}</li>` }).join("\n");
    return `
    <ul class="numberslist ${drawingName.toLowerCase()}numbers">
        ${numberList}
    </ul>
    `
}

function generateLogoSection() {
    return `
    <header role="banner" class="logocontainer">
        <div class="logo"></div>
    </header>
    `
}

function generateDrawingItem(drawing) {
    const numberList = generateNumbersList(drawing.numbers, drawing.name);
    const countDown = generateCountDown(drawing.name, drawing.date);
    return `
        <h2 class="${drawing.name.toLowerCase()}name">${drawing.name}</h2>
            ${numberList}
            ${countDown}
        <div class="${drawing.name.toLowerCase()}history historyhover">
            <a id="${drawing.name.toLowerCase()}historylink" class="historystyle">History</a>
        </div>
    `
}

function generateNumberSection(drawings) {
    return `
    <section role="region" class="numbersection ${drawings[0].name.toLowerCase()}container">          
            ${generateDrawingItem(drawings[0])}     
    </section>
    ${generateHistorySection(drawings[0].name, drawings)}
    `
}

function generateCountDown(drawingName, drawingDate) {
    const today = new Date();
    const nextDrawing = findNextDrawing(drawingName, drawingDate);
    const difference = nextDrawing - today;
    const daysLeft = Math.ceil(difference / (1000 * 60 * 60 * 24));
    const message = daysLeft > 0 ? `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}` : "today";
    return `
    <div class="countdown ${drawingName.toLowerCase()}nextdrawing">
        <span class="days">Next draw is ${message}</span>
    </div>
    `
}

function generateFooterSection() {
    return `
    <footer role="contentinfo" class="footercontainer">
        <div class="landingwindow">    
            <h1>Lotto Brainy</h1>
            <section role="region" class="landinginfo">
            <p>Welcome to Lotto Brainy, an app that brings together handy information about two popular lotteries, Powerball and MegaMillions. But what can Lotto Brainy do for you?</p>      
            <p>Lotto Brainy shows the most current drawing!</p>
            <p>Within each lottery section, you'll find the most current lottery drawing, including the winning numbers, powerball or megaball, and the respective multiplers.</p>
            <p>Lotto Brainy tells when the next drawing is!</p>
            <p>Since both lotteries draw twice a week on different days, this app has conveniently provides a daily countdown.</p>
            <p>Lotto Brainy shows a list of previous draws!</p>
            <p>If you need to find out the previous drawing numbers, Lotto Brainy provides all information from the last 8 drawings. Just click the "History" link to get the details!</p>
            <a id="landingexit" class="landingexitstyle">Start the App!</a>
            </section>
        </div>
        <a id="landingenter" class="footerstyle footerstyleenter">Learn more about this app</a>
    </footer>
    `
}



///// DISPLAY FUNCTIONS /////////////////////////////////////////////////////////////////////////////////////////////

function appendOrReplace(items, container, generator, append = true) {
    const html = generator(items);
    if (append) {
        container.append(html);
    } else {
        container.html(html);
    }
}

function displayLogo(container) {
    $(container).append(generateLogoSection());
}

function displayFooter(container) {
    $(container).append(generateFooterSection());
}

function displayMainPage(drawings) {
    const main = $('main')
    main.empty();                                         
    displayLogo(main);
    displayNumberSection(drawings, main);                 
    displayFooter(main);
}

function displayNumbersList(numbers, container) {
    container.html(generateNumbersList(numbers));
}

function displayNumberSection(drawings, container, append = true) {
    const splitDrawings = splitDrawingsByName(drawings);
    Object.keys(splitDrawings).forEach(splitDrawing => {
        appendOrReplace(splitDrawings[splitDrawing].reverse(), container, generateNumberSection, append);
    });
}

/////// EVENT HANDLERS //////////////////////////////////////

function handleEnterLandingPage() {
    $('main').on('click', '#landingenter', function(event) {
        $('.landingwindow').removeClass('hidden');
    });
}

function handleExitLandingPage() {
    $('main').on('click', '#landingexit', function(event) {
        $('.landingwindow').addClass('hidden');
    });
}

function handleReturnFromPowerballHistory() {
    $('main').on('click', '#historyexit', function(event) {
        $('.powerballhistorysection').addClass('hidden');
    });
}

function handleReturnFromMegaMillionsHistory() {
    $('main').on('click', '#historyexit', function(event) {
        $('.megamillionshistorysection').addClass('hidden');
    });
}

function handleMegaMillionsHistory() {
    $('main').on('click', '#megamillionshistorylink', function(event) {
        $('.megamillionshistorysection').removeClass('hidden');
    });
}

function handlePowerBallHistory() {
    $('main').on('click','#powerballhistorylink', function(event) {
        $('.powerballhistorysection').removeClass('hidden');
    });
}

///// INITIALIZATION //////////////////////////////////////////////////////////////////////////////////////////

function setUpEventHandlers() {
    handleEnterLandingPage();
    handleExitLandingPage();
    handleReturnFromPowerballHistory();
    handleReturnFromMegaMillionsHistory();
    handleMegaMillionsHistory();
    handlePowerBallHistory();
}


function initalize() {
    setUpEventHandlers();
    getLotteryDataFromApi();
}

$(initalize);
