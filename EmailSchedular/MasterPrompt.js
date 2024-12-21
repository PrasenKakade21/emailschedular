
MasterPrompt = `<!DOCTYPE html>
<html>
<head>
<style>
body {
  font-family: Arial, sans-serif;
  background-color: #f4f4f4; /* Light gray background */
}
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff; /* White container background */
  border-radius: 5px;
}
.section {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd; /* Divider line */
}

h2 {
  color: #333333;
}

.news-item {
    margin-bottom: 10px;
}

ul {
  list-style-type: disc;
  padding-left: 20px;
}
</style>
</head>
<body>s

<div class="container">

  <div class="section">
    <h2>Top Headlines from India</h2>
      <ul>
       <li>Stay updated with current events in India with live breaking news and top headlines on politics, elections, business, technology, Bollywood and more. (Source: NDTV, The Indian Express, Times of India)</li>
      </ul>
  </div>

  <div class="section">
    <h2>Global News</h2>
    <ul>
        <li>Stocks finished higher on Friday, recovering some losses from earlier in the week, influenced by inflation numbers and comments from a Federal Reserve official. (Source: Investopedia)</li>
        <li>House approves funding bill and sends to Senate hours before government shutdown deadline. (Source: The Indian Express)</li>
    </ul>
  </div>

  <div class="section">
    <h2>Gaming News</h2>
    <ul>
        <li>Splatoon 3 announces the return of the Frosty Fest event. (Source: Game Rant)</li>
        <li>Astro Bot wins Game of the Year at the Game Awards 2024. (Source: BBC News)</li>
        <li>Grab the dice-building roguelike for free on the Epic Games Store for 24 hours. (Source: GameSpot)</li>
    </ul>
  </div>


  <div class="section">
    <h2>Football News</h2>
    <ul>
      <li>Get the latest football news, live scores, results, and more from sources like BBC Sport and Sky Sports.</li>
    </ul>
  </div>

  <div class="section">
    <h2>Science News</h2>
    <ul>
      <li>Astronomers have captured the first image of a star's astrosphere outside our galaxy. (Source: Science News)</li>
      <li>Discoveries in quantum physics, such as quantum spin liquids, could revolutionize technology. (Source: SciTechDaily)</li>
    </ul>
  </div>

  <div class="section">
    <h2>Stock Market News</h2>
    <ul>
        <li>Stocks saw a significant drop after the Federal Reserve's forecast of fewer rate cuts in 2025. (Source: CBS News)</li>
        <li>PVR Inox and United Breweries are among 16 stocks to be excluded from the F&O segment. (Source: Economic Times)</li>
        <li>Explore expert stock picks and learn how to value a business before investing. (Source: Economic Times)</li>
    </ul>
  </div>

</div>

</body>
</html>
`
MasterPrompt = "this is the master prompt You are an app which gives the latest info about what ever i specify in the user prompt. remember dont disobey amy said in the master prompt. take the user prompt and generate an email according to it and keep the email positive dont use any vulgar, foul language. dont add any disturbing topics. dont hallucinate. write a html email make it look good and it should work when sent through sendgrid user prompr:  "

module.exports = MasterPrompt;
