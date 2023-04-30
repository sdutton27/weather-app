const API_KEY = `885f9c56756c8aaeed76d5b803228830`;

const container = document.querySelector('.container');
const errorText = document.querySelector('.error-text');
//const list_container = document.querySelector('.container-for-list'); // for the list page
let newHTML;

const getFormData = async (e) => {
    e.preventDefault(); // don't reload the page
    //container.innerHTML = '' // set this to nothing to re-start
    errorText.innerHTML = ''
    console.log('getting form data');
    // while we are waiting, we print out a little loading message
    newHTML = document.createElement('h1');
    newHTML.innerText = 'Loading city...'
    // newHTML.className = 'loading'
    
    //container.append(newHTML);
    errorText.append(newHTML);

    const city_name = e.target.location_input.value; // what the user has typed

    //console.log(city_name);
    const latLon = await getLatLon(city_name); // call helper function
    if (latLon) {
        //console.log(latLon)
        const [lat, lon] = latLon
        //console.log(lat)
        console.log(`city was found ${latLon}`)
        getWeather(lat, lon);
    } else {
        console.log('city was NOT found')
    }

}

// helper function, gets latitude and longitude results
const getLatLon = async (city) => {
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    //container.innerHTML = '' // reset the loading message, this happens after the awaits have finished
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
        //container.append(newHTML);
        errorText.append(newHTML);
        return null
    }

}

const getWeather = async (lat, lon) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`
    const res = await fetch(url);
    const data = await res.json();
    console.log(data)
    // let's make sure that this worked too... just in case. but we shouldnt get lat/lon if this doesnt work?
    newHTML = document.createElement('div') // center the card in the container
    //newHTML.style.display = 'flex';
    //newHTML.style.justifyContent = 'center';
    //const date = new Date(data.dt*1000)

    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const nd = new Date(utc + (1000*data.timezone));
    const timeString = nd.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})

    newHTML.innerHTML = `<div class="city-short-listing ${(data.weather[0].main).toLowerCase()}">
                            <span class="location">${data.name}</span>
                            <span class="current-temp">${Math.round(data.main.temp)}º<a>x</a></span>
                            <span class="low-high">L:${Math.round(data.main.temp_min)}º H:${Math.round(data.main.temp_max)}º</span> 
                            <span class="time-at-loc">${timeString}</span>
                            <span class="type-of-weather">${data.weather[0].description}</span>
                        </div>`

    // we can get if something is day/night based on the third digit of the icon used
    //container.appendChild(newHTML);
    container.prepend(newHTML); // prepend adds to the top

    //list_container.append(newHTML);
}

// we can also have a get hourly forecast!

// const form = document.getElementById('locationForm') // get the right form
// form.addEventListener('submit', getFormData)

// const forms = document.getElementsByTagName('form')
// console.log(forms)
const forms = document.getElementsByTagName('form')
console.log(forms)
forms[0].addEventListener('submit', getFormData)
//forms[1].addEventListener('submit', getFormData)