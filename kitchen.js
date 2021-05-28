// ----------------------------------------------------------------------------
const Sdk = require("@dynatrace/oneagent-sdk");
const Api = Sdk.createInstance();

// ----------------------------------------------------------------------------
if (Api.getCurrentState() !== Sdk.SDKState.ACTIVE) {
  console.error("MessagingSample: SDK is not active!");
}
else {
  console.log("Agent with SDK active");
}
const Queue = require('bee-queue');

const systemInfo = {
  destinationName: "Restaurant",
  destinationType: Sdk.MessageDestinationType.QUEUE,
  vendorName: "MessageSystemVendorName",
  host: "message.system.host",
  port: 56012
};

const options = {
    redis: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        password: process.env.DB_PASS,
    },
}

const cookQueue = new Queue('cook', options);

cookQueue.process(3, (job, done) => {
    console.log(job.data.dish);
    const startData = Object.assign({ dynatraceTag: job.data.tag }, systemInfo);
    const inTracer = Api.traceIncomingMessage(startData);
    inTracer.start((dTDone) => {
	Api.addCustomRequestAttribute("Dish Name", job.data.dish);
    	let qty = job.data.qty;
    	let cooked = 0;

    	setTimeout(() => console.log("Getting the ingredients ready 🥬 🧄 🧅 🍄"), 1000);
    	setTimeout(() => {
        	console.log(`🍳 Preparing ${job.data.dish}`);
        	job.reportProgress(10);
    	}, 1500);

    	let timer = setInterval(() => {
        	if (cooked < qty) {
            	cooked++;
            	console.log(`🍳 Progress: ${cooked}/${qty} ${job.data.dish}`);
            	job.reportProgress(((cooked / qty) * 90) + 10);
        	} else {
            	clearInterval(timer);
            	console.log(`🧾 Order ${job.id}: ${job.data.dish} ready`);
            	job.reportProgress(100);
		inTracer.end();
            	done();
        	}
    	}, 4000);
    }, function onDone(error) {
	    if (error) {
		    inTracer.error(error);
	    }
	    console.log("here");
	    inTracer.end()
    });
 });
