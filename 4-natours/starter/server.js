const mongoose= require("mongoose");
const dotenv=require("dotenv");

process.on('uncaughtException', (err) => { //placed before any code to catch all sync errors
  //handles uncought sync errors
  console.log(err.name, err.message);
  console.log('unhandled exceptions! shutting down...');
  process.exit(1); //close the program next (closes program abruptly)
});

dotenv.config({path:'./config.env'});
const app=require('./app');
const DB= process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);
// console.log(DB);
mongoose
  .connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('db connection success');

  }).catch(err=>console.log('ERROR'));
  
const port = process.env.PORT || 8000;
const server=app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {// handles uncaught async errors
  console.log(err.name, err.message);
  console.log('unhandled rejection! shutting down...');
  server.close(()=>{
    //close server first to finish all the req in the background
    process.exit(1); //close the program next (closes program abruptly)
  })
});



//SERVER HAS DATABASE