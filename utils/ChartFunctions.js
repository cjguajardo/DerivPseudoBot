// Calcular la media móvil simple (SMA)
export const calculateSMA = (data, window_period) => {
  let sma = [];
  for (let i = 0; i < data.length - window_period; i++) {
    let sum = 0;
    for (let j = 0; j < window_period; j++) {
      sum += data[i + j];
    }
    sma.push(sum / window_period);
  }
  return sma;
};

// Calcular la media móvil exponencial (EMA)
export const calculateEMA = (data, window_period) => {
  let ema = [data[0]]; // comienza con el primer dato
  let multiplier = 2 / (window_period + 1);
  for (let i = 1; i < data.length; i++) {
    let new_ema = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
    ema.push(new_ema);
  }
  return ema;
};

// Calcular el MACD
export const calculateMACD = (data, short_period, long_period) => {
  let short_EMA = calculateEMA(data, short_period);
  let long_EMA = calculateEMA(data, long_period);
  let MACD_line = [];
  for (let i = 0; i < data.length; i++) {
    MACD_line.push(short_EMA[i] - long_EMA[i]);
  }
  let signal_line = calculateEMA(MACD_line, 9);
  return { MACD_line, signal_line };
};

// Calcular el RSI
export const calculateRSI = (data, window_period) => {
  let diff = [];
  for (let i = 1; i < data.length; i++) {
    diff.push(data[i] - data[i - 1]);
  }
  let gains = diff.map((x) => Math.max(0, x));
  let losses = diff.map((x) => Math.max(0, -x));
  let avg_gain = [];
  let avg_loss = [];
  for (let i = 0; i < diff.length - window_period; i++) {
    let gain_sum = 0;
    let loss_sum = 0;
    for (let j = 0; j < window_period; j++) {
      gain_sum += gains[i + j];
      loss_sum += losses[i + j];
    }
    avg_gain.push(gain_sum / window_period);
    avg_loss.push(loss_sum / window_period);
  }
  let RS = [];
  for (let i = 0; i < avg_gain.length; i++) {
    RS.push(avg_gain[i] / avg_loss[i]);
  }
  let RSI = RS.map((x) => 100 - 100 / (1 + x));
  return RSI;
};

// Función para determinar la tendencia
export const determineTrend = (data) => {
  let sma_short = calculateSMA(data, 12);
  let sma_long = calculateSMA(data, 26);
  let ema_short = calculateEMA(data, 12);
  let ema_long = calculateEMA(data, 26);
  let { MACD_line, signal_line } = calculateMACD(data, 12, 26);
  let RSI = calculateRSI(data, 14);

  // Consideremos los últimos valores de cada indicador
  let last_sma_short = sma_short[sma_short.length - 1];
  let last_sma_long = sma_long[sma_long.length - 1];
  let last_ema_short = ema_short[ema_short.length - 1];
  let last_ema_long = ema_long[ema_long.length - 1];
  let last_MACD = MACD_line[MACD_line.length - 1];
  let last_signal = signal_line[signal_line.length - 1];
  let last_RSI = RSI[RSI.length - 1];

  let trend = 'INDEFINIDA';
  // console.log({
  //   last_sma_short,
  //   last_sma_long,
  //   last_ema_short,
  //   last_ema_long,
  //   last_MACD,
  //   last_signal,
  //   last_RSI,
  // });

  // Podrías modificar estos umbrales según tus necesidades
  if (
    last_sma_short > last_sma_long &&
    last_ema_short > last_ema_long &&
    last_MACD > last_signal &&
    last_RSI > 50
  ) {
    trend = 'ALZA';
  } else if (
    last_sma_short < last_sma_long &&
    last_ema_short < last_ema_long &&
    last_MACD < last_signal &&
    last_RSI < 50
  ) {
    trend = 'BAJA';
  }

  return trend;
};
