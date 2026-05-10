exports.handler = async function (event) {
  const ticker = event.queryStringParameters?.ticker?.toUpperCase();
 
  if (!ticker) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Ticker tidak ditemukan." }),
    };
  }
 
  const symbol = `${ticker}.JK`;
 
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=defaultKeyStatistics,financialData,summaryDetail,price`;
 
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });
 
    if (!res.ok) throw new Error(`Yahoo Finance error: ${res.status}`);
 
    const json = await res.json();
    const result = json?.quoteSummary?.result?.[0];
 
    if (!result) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: `Data ${ticker} tidak ditemukan. Pastikan kode saham benar (contoh: BBCA, TLKM).` }),
      };
    }
 
    const price = result.price;
    const fd    = result.financialData;
    const sd    = result.summaryDetail;
    const ks    = result.defaultKeyStatistics;
 
    // Harga real-time
    const harga      = price?.regularMarketPrice?.raw || sd?.previousClose?.raw || null;
    const change     = price?.regularMarketChange?.raw || null;
    const changePct  = price?.regularMarketChangePercent?.raw || null;
    const high       = price?.regularMarketDayHigh?.raw || null;
    const low        = price?.regularMarketDayLow?.raw || null;
    const volume     = price?.regularMarketVolume?.raw || null;
    const name       = price?.longName || price?.shortName || ticker;
    const marketState = price?.marketState || "CLOSED";
 
    // Fundamental
    const eps    = ks?.trailingEps?.raw || null;
    const bvps   = ks?.bookValue?.raw || null;
    const peRatio = sd?.trailingPE?.raw || ks?.trailingPE?.raw || null;
    const pbRatio = ks?.priceToBook?.raw || null;
    const roe    = fd?.returnOnEquity?.raw
      ? parseFloat((fd.returnOnEquity.raw * 100).toFixed(2))
      : null;
 
    // FCF per share
    const fcf    = fd?.freeCashflow?.raw || null;
    const shares = ks?.sharesOutstanding?.raw || null;
    const fcfps  = fcf && shares ? parseFloat((fcf / shares).toFixed(0)) : null;
 
    // Growth estimate
    const earningsGrowth = fd?.earningsGrowth?.raw
      ? parseFloat((fd.earningsGrowth.raw * 100).toFixed(1))
      : null;
    const revenueGrowth = fd?.revenueGrowth?.raw
      ? parseFloat((fd.revenueGrowth.raw * 100).toFixed(1))
      : null;
    const growthEst = earningsGrowth || revenueGrowth || null;
 
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        ticker,
        symbol,
        name,
        marketState,
        harga:     harga ? Math.round(harga) : null,
        change:    change ? Math.round(change) : null,
        changePct: changePct ? parseFloat((changePct * 100).toFixed(2)) : null,
        high:      high ? Math.round(high) : null,
        low:       low ? Math.round(low) : null,
        volume,
        eps:       eps ? Math.round(eps) : null,
        bvps:      bvps ? Math.round(bvps) : null,
        fcfps,
        peRatio:   peRatio ? parseFloat(peRatio.toFixed(1)) : null,
        pbRatio:   pbRatio ? parseFloat(pbRatio.toFixed(2)) : null,
        roe,
        growthEst,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Gagal fetch data. Coba lagi." }),
    };
  }
};
