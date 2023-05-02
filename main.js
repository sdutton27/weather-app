// Simon Dutton
// due May 1st, 2023
// Weather App
// uses the API from OpenWeatherMap.org to get weather information
// specifically their One Call API 3.0 since it gives us up to 48 hours / 8 days of weather info
// layout inspired by the iPhone Weather App

const API_KEY = `885f9c56756c8aaeed76d5b803228830`;
const container = document.querySelector('.container');
const errorText = document.querySelector('.error-text');
let newHTML;
let singleHTML = '<h2>No cities searched for yet.</h2>'; // for which webpage to show
let multiHTML = '<h2>No cities added yet.</h2>';
let cityName;

const getFormData = async (e) => {
    e.preventDefault(); // don't reload the page
    errorText.innerHTML = ''
    // while we are waiting, we print out a little loading message
    newHTML = document.createElement('h1');
    newHTML.innerText = 'Loading city...'
    errorText.append(newHTML);

    cityName = e.target.location_input.value; // what the user has typed

    const latLon = await getLatLon(cityName); // call helper function
    if (latLon) { // if it was found
        const [lat, lon] = latLon
        getWeather(lat, lon);
    } else {
        console.log('city was NOT found') // message will print to the screen, but so this is also handled here
    }
    e.target.location_input.value = ''; // reset the value to nothing
}

// helper function, gets latitude and longitude results
const getLatLon = async (city) => {
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    errorText.innerHTML = ''

    if (data.length == 1) { // if length = 1 (success)
        return [data[0].lat, data[0].lon];
    } else { // if length = 0, (fail)
        newHTML = document.createElement('h2');
        if (data.cod == 400) { // if the user never inputted anything then this var is created (equal to 400) in the data
            newHTML.innerText = 'Please type in a city.';
        } else { // if the city was not found in the api
            newHTML.innerText = 'City not found.';
        }
        errorText.append(newHTML);
        return null
    }

}

// asynchronous method gets the weather from the API based on the lat/lon
const getWeather = async (lat, lon) => {
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=imperial&appid=${API_KEY}`
    const res = await fetch(url);
    const data = await res.json();
    const timeOfDay = data.current.weather[0].icon[2]

    // only if the city has not been added yet, add it to the multi-view
    if (!(document.querySelector(`.${cityName}`))) {
        let newMultiHTML = document.createElement('div') // center the card in the container
        // to get the properly formatted timestamp in the timezone we want
        const date = new Date();
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const newDate = new Date(utc + (1000*data.timezone_offset));
        const timeString = newDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})

        // putting the cityName as a class for the div and the button so we know which item to remove
        // the .replace() method makes sure that the city name is put in as 1 word for a classname
        // for example, 'Tel Aviv' becomes one class 'telaviv' instead of two classes 'tel' and 'aviv'
        newMultiHTML.innerHTML = `<div class="city-short-listing ${cityName.toLowerCase().replace(/\s+/g, '')}" style="background-image: url(img/${(data.current.weather[0].main).toLowerCase()}-${timeOfDay}.gif)">
                                    <span class="location">${cityName}</span>
                                    <span class="current-temp">${Math.round(data.current.temp)}º<button class="${cityName.toLowerCase().replace(/\s+/g, '')}"onclick="removeElement(event)">x</button></span>
                                    <span class="low-high">L:${Math.round(data.daily[0].temp.min)}º H:${Math.round(data.daily[0].temp.max)}º</span> 
                                    <span class="time-at-loc">${timeString}</span>
                                    <span class="type-of-weather">${data.current.weather[0].description}</span>
                                </div>`

        // if there were no cities added
        if (multiHTML == '<h2>No cities added yet.</h2>' || multiHTML == '<h2>No cities added.</h2>') {
            multiHTML = ''
        }
        // if the container has "no cities added" in it, then delete that"
        const noCitiesAdded = document.getElementsByTagName('h2');
        if (noCitiesAdded.length > 0) {
            console.log('goingthrough here')
            noCitiesAdded[0].remove();
        }
        multiHTML = newMultiHTML.innerHTML + multiHTML; // keep the previous cities
        // if we are currently viewing the multi-view
        if (document.querySelector('.multi-view')) {
            const multiViewContainer = document.querySelector('.multi-view')
            multiViewContainer.prepend(newMultiHTML);
            newHTML = newMultiHTML;
        }
    }

    // for the single-view -- it doesn't matter if the city has been seen before so things are outside this if-statement
    
    // gets the proper background -- needs to be set as a variable so that we can get the background, but not the div itself, opaque
    const backgroundLoc = `img\/${(data.current.weather[0].main).toLowerCase()}-${timeOfDay}\.gif`
    const backgroundURL = `url(${backgroundLoc})`
    container.style.setProperty('--background-gif', backgroundURL);

    // for now, reset to nothing
    let newSingleHTML = document.createElement('div');

    // get the hourly temps HTML through a helper method
    let hourlyTemps = getHourlyTemps(data);

    // checks if it'll rain today
    let dailyRain = ''
    if (data.daily[0].weather[0].main == 'Rain' || data.daily[0].weather[0].main == 'Snow') {
        dailyRain = `<span class="percent-rain">${(Math.round(data.daily[0].pop * 100))}%</span>`
    }
    // checks if it's going to rain in the hour
    let hourlyRain = ''
    if (data.hourly[0].weather[0].main == 'Rain' || data.hourly[0].weather[0].main == 'Snow') {
        hourlyRain = `<span class="hourly-percent-rain">${(Math.round(data.hourly[0].pop * 100))}%</span>`
    }

    // gets the 8-day forecast HTML through a helper method
    let eightDayForecast = getEightDayForecast(data);

    newSingleHTML.innerHTML = `<div class="city-single-listing">
                                <div class="listing-title" align="center">
                                    <span class="location">${cityName}</span>
                                    <span class="current-temp">${Math.round(data.current.temp)}º</span>
                                    <span class="type-of-weather" style="color:white;">${data.current.weather[0].description}</span>
                                    <span class="low-high">L:${Math.round(data.daily[0].temp.min)}º H:${Math.round(data.daily[0].temp.max)}º</span> 
                                </div>
                            </div>
                            <div class="hourly-container">
                                <span>The temperature in ${toTitle(cityName)} feels like ${Math.round(data.current.feels_like)}º due to a humidity percentage of ${data.current.humidity}% and wind speeds up to ${Math.ceil(data.current.wind_speed)} mph.</span>
                                <hr>
                                <div class="hourly-temps">
                                    <div class="single-hourly-temp">
                                        <span>Now</span>
                                        <img src="https://openweathermap.org/img/wn/${data.current.weather[0].icon}@2x.png">
                                        ${hourlyRain}
                                        <span class="hour-temp">${Math.round(data.current.temp)}º</span>
                                    </div>
                                    ${hourlyTemps}
                                </div>
                            </div>
                            <div class="eight-day-container">
                                <div>
                                    <img id="eight-day-icon" src="img/calendar.png">
                                    <span id="eight-day-title">8-DAY FORECAST</span>
                                    <hr id="top-hr">
                                </div>
                                <div class="one-day-forecast">
                                    <span class="day-in-8">Today</span>
                                    ${dailyRain}
                                    <img src="https://openweathermap.org/img/wn/${data.daily[0].weather[0].icon}@2x.png" width="40">
                                    <div class="daily-high-low">
                                        <span>${Math.round(data.daily[0].temp.min)}º</span>
                                        <div class="temp-bar">
                                            <div class="background-bar"></div>
                                            <div class="foreground-bar" style="width:${getBarWidth(data, Math.round(data.daily[0].temp.min), Math.round(data.daily[0].temp.max))}px; left:${getBarOffset(data, Math.round(data.daily[0].temp.min))}px; background-image:linear-gradient(to right, ${getColorForTemp(Math.round(data.daily[0].temp.min))}, ${getColorForTemp(Math.round(data.daily[0].temp.max))});"></div>
                                            <div id="current-temp-dot" style="left:${Math.round(getBarOffset(data, Math.round(data.current.temp)) + 7)}px"></div>
                                        </div>
                                        <span>${Math.round(data.daily[0].temp.max)}º</span>
                                    </div>
                                </div>
                                <hr>
                                ${eightDayForecast}
                            </div>
                            `;
    singleHTML = newSingleHTML.innerHTML;
    // if we are currently viewing the single view
    if (document.querySelector('.single-view')) {
        newHTML = singleHTML;
        const singleViewContainer = document.querySelector('.single-view')
        singleViewContainer.innerHTML = '';
        singleViewContainer.append(newSingleHTML); //append and prepend don't matter since just one thing
    }
    
}

const forms = document.getElementsByTagName('form')
forms[0].addEventListener('submit', getFormData)

// event handler to change the view of the page
const changeView = (event) => {
    // to check, we will get the class list
    let viewType = container.classList[1];
    if (viewType == 'multi-view') { // if we were on multi-view
        multiHTML = container.innerHTML;
        container.className = 'container single-view';
        container.innerHTML = singleHTML;
        //container.innerHTML = singleHTML.innerHTML;
    } else { // if we were on single view
        singleHTML = container.innerHTML;
        container.className = 'container multi-view';
        container.innerHTML = multiHTML;
    }
}

// removes a city from the multi-view based on which one is x-ed out
const removeElement = (event) => {
    const buttonClicked = event.target;
    const divClicked = document.querySelector(`.${buttonClicked.className}`) // since it gets the first and the button is inside the div, it should get the div
    divClicked.remove()
    // if there are no more elements left, clear everything
    if (!document.querySelector('.city-short-listing')) {
        container.innerHTML = '<h2>No cities added.</h2>'
        singleHTML = ''
        container.style.setProperty('--background-gif', 'none');
    }
}

// helper function toTitle() titleCases the name of a city
const toTitle = (cityName) => {
    let newName = ''
    const list = cityName.split(" ")
    for (let i=0; i < list.length; i++) {
        newName += (list[i][0].toUpperCase() + list[i].slice(1))
        if (i < list.length - 1) {
            newName += ' '
        }
    }
    return newName;
}

// gets the hourly temperatures
const getHourlyTemps = (data) => {
    let hourlyTemps = ``;

    // get the value for sunrise/set -- if the sunrise/set already happened, set it to tomorrow's sunrise/set. else today's sunrise/set
    let sunrise = data.current.sunrise < data.current.dt ? data.daily[1].sunrise : data.daily[0].sunrise;
    let sunset = data.current.sunset < data.current.dt ? data.daily[1].sunset : data.daily[0].sunset;

    //using 1 because we don't want the first index in hourly since that's the current hour
    for (let i=1; i <= 24; i++) {
        // check about sunrise and sunset to stick them in the right spot
        if ((sunrise > data.hourly[i-1].dt) && (sunrise < data.hourly[i].dt)) { // if sunrise is greater than the last hour and before the next, add it in
            hourlyTemps += `<div class="single-hourly-temp">
                                <span>Sunrise</span>
                                <img class="sunrise" src="img/sunrise.png" width="40">
                                <span class="hour-temp">${Math.round(data.hourly[i].temp)}º</span>
                            </div>
                        `;
        }
        if ((sunset > data.hourly[i-1].dt) && (sunset < data.hourly[i].dt)) { // if sunset is greater than the last hour and before the next, add it in
            hourlyTemps += `<div class="single-hourly-temp">
                                <span>Sunset</span>
                                <img class="sunset" src="img/sunset.png" width="40">
                                <span class="hour-temp">${Math.round(data.hourly[i].temp)}º</span>
                            </div>
                        `;
        }
        // get the right time for the hour
        const date = new Date(data.hourly[i].dt * 1000);
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const newDate = new Date(utc + (1000*data.timezone_offset));
        const timeString = newDate.toLocaleTimeString([], {hour: 'numeric'})
        // check about rain
        let rain = ''
        if (data.hourly[i].weather[0].main == 'Rain' || data.hourly[i].weather[0].main == 'Snow') {
            rain = `<span class="hourly-percent-rain">${(Math.round(data.hourly[i].pop * 100))}%</span>`
        }
        //create the proper HTML
        hourlyTemps += `<div class="single-hourly-temp">
                            <span>${timeString}</span>
                            <img src="https://openweathermap.org/img/wn/${data.hourly[i].weather[0].icon}@2x.png">
                            ${rain}
                            <span class="hour-temp">${Math.round(data.hourly[i].temp)}º</span>
                        </div>
                        `;
    }
    return hourlyTemps;
}

// creates the HTML for each of the days in the 8 day forecast
const getEightDayForecast = (data) => {
    let eightDayForecast = ``;
    for (let i = 1; i <= 7; i++) {
        // get the week day
        const date = new Date(data.daily[i].dt * 1000);
        const weekdayString = date.toLocaleDateString([], {weekday: 'short'})
        // check if it's going to rain that day
        let rain = ''
        if (data.daily[i].weather[0].main == 'Rain' || data.daily[i].weather[0].main == 'Snow') {
            rain = `<span class="percent-rain">${(Math.round(data.daily[i].pop * 100))}%</span>`
        }
        // create HTML for that day
        eightDayForecast += `<div class="one-day-forecast">
                            <span class="day-in-8">${weekdayString}</span>
                            <img src="https://openweathermap.org/img/wn/${data.daily[i].weather[0].icon}@2x.png" width="40">
                            ${rain}
                            <div class="daily-high-low">
                                <span>${Math.round(data.daily[i].temp.min)}º</span>
                                <div class="temp-bar">
                                    <div class="background-bar"></div>
                                    <div class="foreground-bar" style="width:${getBarWidth(data, Math.round(data.daily[i].temp.min), Math.round(data.daily[i].temp.max))}px; left:${getBarOffset(data, Math.round(data.daily[i].temp.min))}px; background-image:linear-gradient(to right, ${getColorForTemp(Math.round(data.daily[i].temp.min))}, ${getColorForTemp(Math.round(data.daily[i].temp.max))});"></div>
                                </div>
                                <span>${Math.round(data.daily[i].temp.max)}º</span>
                            </div>
                        </div>
                        `;
        if (i < 7) { // if not the last one, add the divider line
            eightDayForecast += '<hr>'
        }
    } return eightDayForecast;
}

// gets the color for the endpoints on the bar, based on the temperature
const getColorForTemp = (temp) => {
    switch (true) { // has to be true if switching on a range
        case temp < 32:
            return '#00008B'; // dark blue
        case (temp > 32 && temp <= 59):
            return '#00FFFF'; // light blue (cyan)
        case (temp > 59 && temp <= 68):
            return '#00FF00'; // green
        case (temp > 68 && temp <= 77):
            return '#FFFF00'; // yellow
        case (temp > 77 && temp <= 86):
            return '#FFA500'; // orange
        case (temp > 86):
            return '#FF0000'; // red
    }
}

// methods to calculate where the bar value should be

// gets the minimum and maximum temperatures for a week
const getBarValues = (data) => {
    // get the minimum/max temp values for the week
    let max, min;
    for (let i = 0; i <= 7; i++) {
        if (Math.round(data.daily[i].temp.min) < min || !min) {
            min = Math.round(data.daily[i].temp.min)
        }
        if (Math.round(data.daily[i].temp.max) > max || !max) {
            max = Math.round(data.daily[i].temp.max)
        }
    } return [min, max]
}

// gets the left-offset for the point of a temperature on the bar for that week
// also works to get the location of the point for the current temperature
const getBarOffset = (data, temp) => {
    const [min, max] = getBarValues(data);
    const dist = max - min // how many units the temp varies by this week
    const offset = ((temp-min) / dist) * 70 // 70px is the width of the full bar
    return (offset)
}

// gets how wide the coloring on the bar needs to be that day
const getBarWidth = (data, minTemp, maxTemp) => {
    // width = point at max for that day - point at min for that day
    return getBarOffset(data, maxTemp) - getBarOffset(data, minTemp)
}
