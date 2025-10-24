const apiKey = "9505fd1df737e20152fbd78cdb289b6a";
const app = document.getElementById("app");
const form = document.getElementById("weatherForm");
const cityInput = document.getElementById("cityInput");
const forecastContainer = document.getElementById("forecastContainer");
const chartSection = document.getElementById("chartSection");
const ctx = document.getElementById("forecastChart").getContext("2d");
let chart;

const toTime = (unix) => new Date(unix * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function setBackground(condition, isNight) {
  app.className = "app";
  const cond = condition.toLowerCase();
  if (isNight) app.classList.add("night");
  else if (cond.includes("rain")) app.classList.add("rain");
  else if (cond.includes("cloud")) app.classList.add("clouds");
  else if (cond.includes("snow")) app.classList.add("snow");
  else if (cond.includes("mist")) app.classList.add("mist");
  else app.classList.add("clear");
}

async function getWeather(city) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
  const data = await res.json();
  if (data.cod !== 200) return alert("City not found!");

  document.getElementById("cityName").textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById("description").textContent = data.weather[0].description;
  document.getElementById("temp").textContent = data.main.temp.toFixed(1);
  document.getElementById("feels").textContent = data.main.feels_like.toFixed(1);
  document.getElementById("humidity").textContent = data.main.humidity;
  document.getElementById("pressure").textContent = data.main.pressure;
  document.getElementById("wind").textContent = (data.wind.speed * 3.6).toFixed(1);
  document.getElementById("sunrise").textContent = toTime(data.sys.sunrise);
  document.getElementById("sunset").textContent = toTime(data.sys.sunset);
  document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;

  const isNight = data.weather[0].icon.includes("n");
  setBackground(data.weather[0].main, isNight);
}

async function getForecast(city) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`);
  const data = await res.json();
  const daily = {};

  data.list.forEach(item => {
    const date = item.dt_txt.split(" ")[0];
    if (!daily[date]) daily[date] = [];
    daily[date].push(item);
  });

  forecastContainer.innerHTML = "";

  Object.keys(daily).slice(0, 5).forEach(date => {
    const temps = daily[date].map(i => i.main.temp);
    const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
    const icon = daily[date][0].weather[0].icon;

    const div = document.createElement("div");
    div.classList.add("forecast-day");
    div.innerHTML = `
      <p><strong>${date}</strong></p>
      <img src="https://openweathermap.org/img/wn/${icon}.png" />
      <p>${avgTemp}°C</p>
    `;
    div.addEventListener("click", () => showChart(date, daily[date]));
    forecastContainer.appendChild(div);
  });
}

function showChart(date, dayData) {
  chartSection.classList.remove("hidden");
  document.getElementById("chartTitle").textContent = `Temperature Trend - ${date}`;
  const times = dayData.map(i => i.dt_txt.split(" ")[1].slice(0, 5));
  const temps = dayData.map(i => i.main.temp);

  if (chart) chart.destroy();

  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, "rgba(255, 215, 0, 0.8)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: times,
      datasets: [{
        label: "Temperature (°C)",
        data: temps,
        borderColor: "#ffda79",
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#fff",
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: false } },
      animation: { duration: 1000, easing: "easeOutQuart" },
    },
  });
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city) {
    getWeather(city);
    getForecast(city);
  }
});

navigator.geolocation?.getCurrentPosition(pos => {
  const { latitude, longitude } = pos.coords;
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      getWeather(data.name);
      getForecast(data.name);
    });
}, () => {
  getWeather("Mumbai");
  getForecast("Mumbai");
});
