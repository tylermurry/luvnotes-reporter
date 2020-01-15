# LuvNotes Reporter for Little Sunshines Daycare
This simple utility will scrape Little Sunshine's website to gather the daily LuvNote report and send an email with the summarized content.

## Requirements
* Little Sunshine's Daycare account (https://www.littlesunshine.com)
* Node / npm

## Usage
1. Create a custom Gmail account to send the reports from. This is preferable to using your personal email since you can customize the contact info in your phone so it's clearer who is sending you the message.  
1. Clone repo
2. Navigate to folder within a terminal and run `npm install`
3. Kick off the script: `node ./index.js {see options below}`
    * This will run indefinitely and poll the site for data every 60 seconds.
    
##### Options
* `--lsUser` - Little Sunshine's Username
* `--lsPassword` - Little Sunshine's Password
* `--emailUser` - The username of the email gmail account you want to send the emails from
* `--emailPassword` - The username of the gmail account you want to send the emails from
* `--children` - Quoted, comma-separated list of children you want reports for. E.g. `--children="John Smith,Jane Smith"` 
* `--toEmails` - Quoted, semi-colon-separated list of emails you want the report to be sent to. E.g. `--toEmails="1111111111@mms.att.net;someemail@gmail.com"`
* `--interval` - The amount of time between runs. Default is 60 seconds.
* `--debug` - Show verbose errors.

###### Full Example:
`node ./index.js --lsUser=SomeUser --lsPass=SomePass --emailUser=EmailUser --emailPass=EmailPass --children="John Smith, Jane Smith" --toEmails="1111111111@mms.att.net;anotheremail.com" --internal=90`
