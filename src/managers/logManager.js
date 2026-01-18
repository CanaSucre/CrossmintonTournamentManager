// ------------------------ //
//         IMPORTS          //
// ------------------------ //
const moment = require("moment");
moment.locale("fr");

const { LogTypes } = require("../enums/LogType");

const fs = require("fs");
const path = require("path");

// ------------------------ //
//        CONSTANTES        //
// ------------------------ //
const FORMAT_TIMESTAMP = "DD-MM-YYYY HH:mm:ss:SSS";
const LOG_FILE_PATH = "./logs/%dd%-%mm%-%yyyy%.log";

const DATE_PLACEHOLDERS = {
    "%dd%": () => moment().format("DD"),
    "%mm%": () => moment().format("MM"),
    "%yyyy%": () => moment().format("YYYY"),
};

const LEVEL_PREFIXES = {
    [LogTypes.INFO]: "INFO",
    [LogTypes.WARNING]: "WARNING",
    [LogTypes.ERROR]: "ERROR",
    [LogTypes.DEBUG]: "DEBUG",
};

const LEVEL_COLORS = {
    [LogTypes.INFO]: "\x1b[32m",    // Green
    [LogTypes.WARNING]: "\x1b[33m", // Yellow
    [LogTypes.ERROR]: "\x1b[31m",   // Red
    [LogTypes.DEBUG]: "\x1b[34m",   // Blue
};

const COLOR_RESET = "\x1b[0m";

const LOG_FORMAT = "[%timestamp%] %level_prefix%: %message%";

// ------------------------ //
//        PROGRAMME         //
// ------------------------ //


const getLogFilePath = () => {
    let path = LOG_FILE_PATH;


    for (const placeholder in DATE_PLACEHOLDERS) {
        path = path.replace(placeholder, DATE_PLACEHOLDERS[placeholder]());
    }

    return path;
};

const formatLogMessage = (level, message) => {
    const timestamp = moment().format(FORMAT_TIMESTAMP);
    const levelPrefix = LEVEL_PREFIXES[level] || "LOG";

    return LOG_FORMAT
        .replace("%timestamp%", timestamp)
        .replace("%level_prefix%", levelPrefix)
        .replace("%message%", message);
}

const log = (level, message, silent = false) => {
    const formattedMessage = formatLogMessage(level, message);
    const color = LEVEL_COLORS[level] || "";

    if (!silent) {
        console.log(`${color}${formattedMessage}${COLOR_RESET}`);
    }
    const logFilePath = getLogFilePath();
    const logDir = path.dirname(logFilePath);

    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(logFilePath, formattedMessage + "\n", "utf8");
}

const info = (message, silent = false) => {
    log(LogTypes.INFO, message, silent);
}

const warning = (message, silent = false) => {
    log(LogTypes.WARNING, message, silent);
}

const error = (message, silent = false) => {
    log(LogTypes.ERROR, message, silent);
}

const debug = (message, silent = false) => {
    log(LogTypes.DEBUG, message, silent);
}

module.exports = {
    info,
    warning,
    error,
    debug
};