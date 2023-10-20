const express = require("express")
const firebase = require("./fb")
const bodyParser = require("body-parser")
const path  = require("path")
const crypt = require("crypto")
const port = process.env.PORT || 5000

const app = express()
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

let currentSensorReading = 0
let sessions = {}
let sessionCount = 0

////////////////////////////// API CODE ///////////////////////////////

function createNewUserAccount(req, res){   
    
    let emailHash = crypt.createHash("sha256").update(req.body.email).digest("hex") 
    let ref = firebase.database().ref("Users").child(emailHash)
    let snapshotHandler = snapshot => {
        ref.off('value', snapshotHandler)
        if(snapshot.val()){
            res.send({errorCode:100, errorMessage:"Account Exists"})
        }else{
            firebase.database().ref("Users").child(emailHash).set(JSON.parse(JSON.stringify(req.body)))
            res.send({errorCode:0, errorMessage:"New Account Created", redirect:"/"})
        }
    }

    ref.on('value', snapshotHandler)
}

function generateToken(){
    return crypt.createHash("sha256").update(Math.floor(new Date()).toString()).digest("hex")    
}

function userAccountLogin(req, res){
    let emailHash = crypt.createHash("sha256").update(req.body.email).digest("hex") 
    let ref = firebase.database().ref("Users").child(emailHash)
    let snapshotHandler = snapshot => {
        
        ref.off('value', snapshotHandler)
        let data = snapshot.val()

        if(data){
            if(data.password === req.body.password){
                let token = generateToken()
                sessions[token] = Math.floor(new Date() / 1000)
                res.send({errorCode:0, errorMessage:"Press OK to Continue", redirect:`/${data.userType}`, token:token})
                sessionCount++
            }else{
                res.send({errorCode:200, errorMessage:"Invalid Email or Password"})                
            }
        }else{
            res.send({errorCode:200, errorMessage:"Invalid Email or Password"})
        }
    }

    ref.on('value', snapshotHandler)
}

function receiveOrderObject(req, res){
    try{
    
        let orderId = crypt.createHash("sha256").update(Math.floor(new Date()).toString()).digest("hex") 
        let ref = firebase.database().ref("NewFuelOrders").child(orderId)
        req.body.dateOfIssue=new Date().toString()
        ref.set(JSON.parse(JSON.stringify(req.body)))
        res.send({errorCode:0, errorMessage:"Order Sent", redirect:`/distributor`})

    }catch(e){
        res.send({errorCode:300, errorMessage:"Error Processing Order"})
    }
}

function receiveClientOrderObject(req, res){
    try{
    
        let orderId = crypt.createHash("sha256").update(Math.floor(new Date()).toString()).digest("hex")
        let userId =  crypt.createHash("sha256").update(req.body.userId).digest("hex")
        let ref = firebase.database().ref("ClientFuelOrders").child(userId).child(orderId)
        req.body.dateOfIssue=new Date().toString()
        ref.set(JSON.parse(JSON.stringify(req.body)))
        res.send({errorCode:0, errorMessage:"Order Sent", redirect:`/client`})

    }catch(e){
        res.send({errorCode:300, errorMessage:"Error Processing Order"})
    }
}

function getSensorData(req, res){
    let v  = parseInt(req.query['value'])
    if(100 >= v){
        currentSensorReading = (((100 - v)*100) / 100).toFixed()
    }

    if(currentSensorReading > 100){
        currentSensorReading = 0
    }
    res.end()
}

function getOrderMetrics(req, res){
    try{
        let ordersSent = 0
        let ordersRef = firebase.database().ref("NewFuelOrders")

        let ordersSnapshotHandler = snapshot => {
            ordersRef.off('value', ordersSnapshotHandler)
            let docs = snapshot.val()
            for(let key in docs){
                ordersSent++
            }

            res.send({errorCode:0, errorMessage:"Data",data:ordersSent})
        }
        
        ordersRef.on('value', ordersSnapshotHandler)
    }catch(e){
        console.log(e)
        res.send({errorCode:500, errorMessage:"Failed to get data"})
    }
}

function getMetrics(req, res){
    
    let data = {}
    
    data.suppliers = 0
    data.distributors = 0
    data.sensor = 0

   try{

        let userRef = firebase.database().ref("Users")

        let snapshotHandler = snapshot => {

            userRef.off('value', snapshotHandler)
            let docs = snapshot.val()

            for(let key in docs){
                switch(docs[key].userType){
                    case 'supplier':
                        data.suppliers++
                        break
                    case 'distributor':
                        data.distributors++
                        break;
                }
            }

            data.sensor = currentSensorReading
            res.send({errorCode:0, errorMessage:"Data", data:data})
        }

        userRef.on('value', snapshotHandler)

   }catch(e){
        res.send({errorCode:400, errorMessage:"Failed to get data"})
   }
}

function getClientOrdersData(req, res){
    try{
        let userId = crypt.createHash('sha256').update(req.query.userId).digest('hex')
        let ordersRef = firebase.database().ref("ClientFuelOrders").child(userId)

        let ordersSnapshotHandler = snapshot => {
            ordersRef.off('value', ordersSnapshotHandler)
            let docs = snapshot.val()
            res.send({errorCode:0, errorMessage:"Data",data:docs})
        }
        
        ordersRef.on('value', ordersSnapshotHandler)
    }catch(e){
        res.send({errorCode:500, errorMessage:"Failed to get data"})
    }
}

function getNewFuelOrdersData(req, res){
    try{
        let ordersRef = firebase.database().ref("NewFuelOrders")

        let ordersSnapshotHandler = snapshot => {
            ordersRef.off('value', ordersSnapshotHandler)
            let docs = snapshot.val()
            res.send({errorCode:0, errorMessage:"Data",data:docs})
        }
        
        ordersRef.on('value', ordersSnapshotHandler)
    }catch(e){
        res.send({errorCode:500, errorMessage:"Failed to get data"})
    }
}

function getProcessedsOrdersData(req, res){
    try{
        let ordersRef = firebase.database().ref("ProcessedFuelOrders")

        let ordersSnapshotHandler = snapshot => {
            ordersRef.off('value', ordersSnapshotHandler)
            let docs = snapshot.val()
            res.send({errorCode:0, errorMessage:"Data",data:docs})
        }
        
        ordersRef.on('value', ordersSnapshotHandler)
    }catch(e){
        res.send({errorCode:500, errorMessage:"Failed to get data"})
    }
}

function getCancelledOrdersData(req, res){
    try{
        let ordersRef = firebase.database().ref("CancelledFuelOrders")

        let ordersSnapshotHandler = snapshot => {
            ordersRef.off('value', ordersSnapshotHandler)
            let docs = snapshot.val()
            res.send({errorCode:0, errorMessage:"Data",data:docs})
        }
        
        ordersRef.on('value', ordersSnapshotHandler)
    }catch(e){
        res.send({errorCode:500, errorMessage:"Failed to get data"})
    }
}


function checkSessionAuthenticity(req, res){
    if(sessions[req.query.token]){
        let ttl = sessions[req.query.token]
        let timeLeft = Math.floor(new Date() / 1000) - ttl
        if(300 >= timeLeft){
            res.send({})
        }else{
            delete sessions[req.query.token]
            res.send({errorCode:0, errorMessage:"Session Expired", redirect:"/expired"})
        }
    }else{
        res.send({errorCode:0, errorMessage:"Access Denied", redirect:"/block"})
    }
}

////////////////////////////// API CODE ///////////////////////////////

////////////////////////////// VIEW CODE ///////////////////////////////

function signinRender(req, res){
    res.sendFile("public/pages/sign-in-3e5247c357cd1b2b3ef9b9eba4eea66b.html", {root: path.join(__dirname)})
}

function signupRender(req, res){
    res.sendFile("public/pages/sign-up-3232cb6b61415092122d840c1f61664b.html", {root: path.join(__dirname)})
}

function renderDistributorPage(req, res){
    res.sendFile("public/distributor-2196f4f692c7cbcb4e303fd2d2cb0c42.html", {root: path.join(__dirname)})
}

function renderSupplierPage(req, res){
    res.sendFile("public/supplier-99b0e8da24e29e4ccb5d7d76e677c2ac.html", {root: path.join(__dirname)})
}

function renderOrderingPage(req, res){
    res.sendFile("public/pages/place-order-f006bf27d70849fffcdbfa6da27c9259.html", {root: path.join(__dirname)})
}

function renderClientOrderingPage(req, res){
    res.sendFile("public/pages/client-order-f006bf27d70849fffcdbfa6da27c9259.html", {root: path.join(__dirname)})
}

function renderAccessDeniedPage(req, res){
    res.sendFile("public/pages/access-denied-e000c05c48925a2b60ca58c571da417f.html", {root: path.join(__dirname)})
}

function renderExpiredSessionPage(req, res){
    res.sendFile("public/pages/expired-c4bfb2a0bab0e91bc7dcfbe3bbec246e.html", {root: path.join(__dirname)})  
}

function renderClientPage(req, res){
    res.sendFile("public/client-a6fc1694641b335a03e61b6bdffbe11a.html", {root: path.join(__dirname)})  
}

////////////////////////////// VIEW CODE ///////////////////////////////

////////////////////////////// VIEW ENDPOINTS ///////////////////////////////

app.get("/", signinRender)
app.get("/signup", signupRender)
app.get("/distributor", renderDistributorPage)
app.get("/supplier", renderSupplierPage)
app.get("/client", renderClientPage)
app.get("/order", renderOrderingPage) 
app.get("/client-order", renderClientOrderingPage)
app.get("/block", renderAccessDeniedPage)
app.get("/expired", renderExpiredSessionPage)
////////////////////////////// VIEW ENDPOINTS ///////////////////////////////

////////////////////////////// API ENDPOINTS ///////////////////////////////

app.post("/new", createNewUserAccount)
app.post("/auth", userAccountLogin)
app.post("/ordering", receiveOrderObject)
app.post("/client-ordering", receiveClientOrderObject)

app.get("/metrics", getMetrics)
app.get("/orders", getOrderMetrics)
app.get("/api", getSensorData)
app.get("/check-auth", checkSessionAuthenticity)
app.get("/new-orders", getNewFuelOrdersData)
app.get("/client-orders", getClientOrdersData)
app.get("/processed-orders", getProcessedsOrdersData)
app.get("/cancelled-orders", getCancelledOrdersData)

////////////////////////////// API ENDPOINTS ///////////////////////////////


app.listen(port, ()=>{ console.log("Server --->>") } )
