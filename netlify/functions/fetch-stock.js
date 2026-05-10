exports.handler = async function (event) {
  const ticker = event.queryStringParameters?.ticker?.toUpperCase();
 
  if (!ticker) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Ticker tidak ditemukan." }),
    };
  }
 
  const apiKey = process.env.ALPHA_API_KEY;
  const symbol = `${ticker}.JK`;
 
  try {
    // Fetch harga real-time (Global Quote)
    const quoteRes = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );
    const quoteData = await quoteRes.json();
    const quote = quoteData["Global Quote"];
 
    if (!quote || !quote["05. price"]) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `Data untuk ticker ${ticker} tidak ditemukan. Pastikan kode saham benar (contoh: BBCA, TLKM).`,
        }),
      };
    }
 
    // Fetch data fundamental (Overview)
    const overviewRes = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`
    );
    const overview = await overviewRes.json();
 
    const result = {
      ticker,
      symbol,
      // Harga real-time
      price: parseFloat(quote["05. price"]),
      change: parseFloat(quote["09. change"]),
      changePercent: quote["10. change percent"],
      high: parseFloat(quote["03. high"]),
      low: parseFloat(quote["04. low"]),
      volume: parseInt(quote["06. volume"]),
      latestTradingDay: quote["07. latest trading day"],
 
      // Fundamental (dari Overview)
      eps: overview["EPS"] ? parseFloat(overview["EPS"]) : null,
      bookValue: overview["BookValue"] ? parseFloat(overview["BookValue"]) : null,
      peRatio: overview["PERatio"] ? parseFloat(overview["PERatio"]) : null,
      pbRatio: overview["PriceToBookRatio"] ? parseFloat(overview["PriceToBookRatio"]) : null,
      roe: overview["ReturnOnEquityTTM"] ? (parseFloat(overview["ReturnOnEquityTTM"]) * 100).toFixed(2) : null,
      sector: overview["Sector"] || null,
      name: overview["Name"] || ticker,
    };
 
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Gagal mengambil data. Coba lagi." }),
    };
  }
};
