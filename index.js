const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromeDriverPath = require('chromedriver').path;
const moment = require('moment');
const nodemailer = require("nodemailer");

let driver;
let sentDates = [];
const {
    children, lsUser, lsPass, emailUser, emailPass, interval=60, toEmails
} = require('minimist')(process.argv.slice(2));

// ----- Core -----

const buildChromeDriver = () => {
    const service = new chrome.ServiceBuilder(chromeDriverPath).build();
    chrome.setDefaultService(service);

    return new webdriver.Builder()
        .withCapabilities(webdriver.Capabilities.chrome())
        .setChromeOptions(new chrome.Options().headless())
        .build();
};

const findElementById = async (id) => {
    return await driver.findElement(webdriver.By.id(id));
};

const findElementByXPath = async (xpath) => {
    return await driver.findElement(webdriver.By.xpath(xpath));
};

const getTextByXPath = async (xpath) => {
    const element = await findElementByXPath(xpath);
    return await element.getText();
};

const sendKeysToId = async (id, keys) => {
    const element = await findElementById(id);
    await element.sendKeys(keys);
};

const clickById = async (id) => {
    const element = await findElementById(id);
    await element.click();
};

const waitForId = async(id) => {
    await  driver.wait(webdriver.until.elementLocated(webdriver.By.id(id)));
};

// ----- Workflows -----

const login = async (username, password) => {
    await driver.get('https://secure.littlesunshine.com/student-reports');
    await sendKeysToId('edit-name', username);
    await sendKeysToId('edit-pass', password);
    await clickById('edit-submit');
    await waitForId('page-title');
};

const getReport = async (date, name) => {
    console.log(`Getting report for ${name}...`);

    await driver.get(`https://secure.littlesunshine.com/content/${name}-report-${date}`);
    await waitForId('page-title');

    return {
        disposition: await getTextByXPath('//*[@id="block-system-main"]/div/div/div/div[2]/div[2]/div/div[1]/div[2]'),
        activity: await getTextByXPath('//*[@id="block-system-main"]/div/div/div/div[2]/div[2]/div/div[1]/div[5]'),
        todayIAte: await getTextByXPath('//*[@id="block-system-main"]/div/div/div/div[2]/div[2]/div/div[1]/div[8]'),
        meal: await getTextByXPath('//*[@id="block-system-main"]/div/div/div/div[2]/div[2]/div/div[1]/div[11]'),
        nappedWell: await getTextByXPath('//*[@id="block-system-main"]/div/div/div/div[2]/div[2]/div/div[1]/div[14]'),
        napNotes: await getTextByXPath('//*[@id="block-system-main"]/div/div/div/div[2]/div[2]/div/div[1]/div[17]'),
        itemsToBring: await getTextByXPath('//*[@id="block-system-main"]/div/div/div/div[2]/div[2]/div/div[1]/div[20]'),
        neededItems: await getTextByXPath('//*[@id="block-system-main"]/div/div/div/div[2]/div[2]/div/div[1]/div[23]'),
        notesFromTeacher: await getTextByXPath('//*[@id="block-system-main"]/div/div/div/div[2]/div[2]/div/div[1]/div[23]'),
        imageUrl: await(await findElementByXPath('//*[@id="block-system-main"]/div/div/div/div[3]/div[2]/div/img')).getAttribute('src'),
    };
};

// ----- Email Reporting -----

const sendReport = async (report, name) => {

    console.log(`Sending report for ${name}...`);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });

    let info = await transporter.sendMail(buildEmailData(report, name));

    console.log("Message sent: %s", info.messageId);
};

const buildEmailData = (report, name) => {
    return {
        from: 'LuvNotesReporter <luvnotesreporter@gmail.com>',
        to: toEmails,
        subject: `${name}'s LuvNote Report for ${moment().format('dddd, MMMM Do')}`,
        html: `
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                </head>
                <body style="font-family: 'Palatino Linotype'">
                    <p>
                        <h3>Disposition</h3>
                        ${report.disposition}
                    </p>
                    <p>
                        <h3>Activity</h3>
                        ${report.activity}
                    </p>
                    <p>
                        <h3>Today I...</h3>
                        <ul>
                            <li><b>Ate:</b> ${report.todayIAte} - ${report.meal}</li>
                            <li><b>Napped Well:</b> ${report.nappedWell} - ${report.napNotes}</li>
                        </ul>
                    </p>
                    <p>
                        <h3>Other</h3>
                        <ul>
                            <li><b>Items to Bring:</b> ${report.itemsToBring}</li>
                            <li><b>Notes from Teacher:</b> ${report.notesFromTeacher}</li>
                            <li><b>Needed Items:</b> ${report.neededItems}</li>
                        </ul>
                    </p>
                    <img style='height: 100%; width: 100%; object-fit: contain' src="${report.imageUrl}" />
                </body>
            </html>
        `
    }
};

// ----- Main ------

const main = async () => {
    console.log('Starting...');

    driver = buildChromeDriver();

    while(true) {

        try { await login(lsUser, lsPass); } catch(e) {}

        try {
            // const today = 'jul-1-2019';
            const today = moment().format('MMM-d-YYYY').toLowerCase();

            for (const child of children.split(',')) {
                const childKey = `${child}-${today}`;
                if (!sentDates.includes(childKey)) {
                    await getReport(today, child.replace(' ', '-').toLowerCase())
                        .then(report => sendReport(report, child))
                        .then( () => sentDates.push(childKey))
                        .catch(() => console.log(`Could not get ${child}\'s report`));
                }
            }

            console.log(`Done. Sleeping for ${interval} seconds...`);

            await new Promise(resolve => setTimeout(resolve, interval * 1000));
        }
        catch(e) {
            console.log(e);
        }
    }
};

main();