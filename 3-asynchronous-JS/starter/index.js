const fs = require("fs");
const superagent = require("superagent");


const readFilePro = file=>{
    return new Promise((resolve,reject)=>{
        fs.readFile(file,(err,data)=>{
            if(err)
                reject('i could not find that file');
            resolve(data);
        })
    })
}

const writeFilePro= (file,data)=>{
    return new Promise((resolve,reject)=>{
        fs.writeFile(file,data,err=>{
            if(err)
                reject('i could not write the file')
            resolve('success');
        })
    })
}

const getDogPic= async ()=>{
    try{
        const data= await readFilePro(`${__dirname}/dog.txt`)
        console.log(`Breed: ${data}`)
        const res1pro=superagent.get()
    }
    catch{

    }
}