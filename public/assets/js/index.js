var fuelData = [-1,-1,-1]
var fuelDistributionData = {petrol:-1, diesel:-1, blend:-1}

function createNewAccount(){

    let userObject = {}
    
    userObject.fullName = $("#name_text").val()
    userObject.email = $("#email_text").val()
    userObject.password = $("#password_text1").val()
    userObject.userType = $("#type").val()

    if(userObject.fullName.length > 2 && userObject.email.length > 8 && userObject.password.length > 7){
        if(userObject.password === $("#password_text2").val()){
            $.post(`${window.location.origin}/new`, userObject).then( response => {
                alert(response.errorMessage)
                if(response.redirect){
                    window.location.href = `${window.origin}${response.redirect}`
                }
            })
        }else{
            alert("Passwords Dont Match")
        }
    }else{
        alert("Check all your inputs")
    }
}

function loginIntoAccount(){
    
    let userObject = {}
    userObject.email = $("#signin_email_text").val()
    userObject.password =  $("#signin_password_text").val()

    if(userObject.email.length > 8 && userObject.password.length > 7){
        $.post(`${window.location.origin}/auth`, userObject).then( response => {
            if(response.redirect){
                sessionStorage.userId = userObject.email
                window.location.href = `${window.origin}${response.redirect}`
                sessionStorage.sessionToken = response.token
            }else{
                alert(response.errorMessage)
            }
        })
    }else{
        alert("Check all your inputs")
    }

}

function sendNewOrder(){
    
    let orderDataObject = {}
    try{
        orderDataObject.stationName = $("#station_name").val()
        orderDataObject.location = $("#station_location").val()
        orderDataObject.fuelQuantity = parseInt($("#fuel_quantity").val())
        orderDataObject.fuelType = $("#fuels").val()
        orderDataObject.status = "Pending Processing"

        if(orderDataObject.fuelQuantity > 0 && orderDataObject.stationName.length > 2 && orderDataObject.location.length > 2 && orderDataObject.fuelQuantity > 2 && orderDataObject.fuelType.length > 2){
            $.post(`${window.location.origin}/ordering`, orderDataObject).then( response => {
                if(response.redirect){
                    alert(response.errorMessage)                    
                    window.location.href = `${window.origin}${response.redirect}`
                }else{
                    alert(response.errorMessage)
                }
            }) 
        }else{
            alert("Invalid Fuel Order Data")
        }
    }catch(e){
        alert("Data Processing Error")
    }
}

function sendClientNewOrder(){
    
    let orderDataObject = {}
    try{
        orderDataObject.stationName = $("#station_name").val()
        orderDataObject.location = $("#station_location").val()
        orderDataObject.fuelQuantity = parseInt($("#fuel_quantity").val())
        orderDataObject.fuelType = $("#fuels").val()
        orderDataObject.status = "Pending Processing"
        orderDataObject.userId = sessionStorage.userId

        if(orderDataObject.fuelQuantity > 0 && orderDataObject.stationName.length > 2 && orderDataObject.location.length > 2 && orderDataObject.fuelQuantity > 2 && orderDataObject.fuelType.length > 2){
            $.post(`${window.location.origin}/client-ordering`, orderDataObject).then( response => {
                if(response.redirect){
                    alert(response.errorMessage)                    
                    window.location.href = `${window.origin}${response.redirect}`
                }else{
                    alert(response.errorMessage)
                }
            }) 
        }else{
            alert("Invalid Fuel Order Data")
        }
    }catch(e){
        alert("Data Processing Error")
    }
}

function getSystemMetrics(){
    $.get(`${window.location.origin}/metrics`).then( response => {
        $("#suppliers").text(response.data.suppliers)
        $("#distributors").text(response.data.distributors)
        $("#fuel_level").text(`${response.data.sensor} %`)
        renderChart3([parseInt(response.data.distributors), parseInt(response.data.suppliers)])
    })
}

function getOrdersValue(){
    $.get(`${window.location.origin}/orders`).then( response => {
        $("#orders_sent").text(response.data)
    })
}

function getClientOrdersDataObjects(){

    let table = document.getElementById("client_orders_table")
    if(table){

        $.get(`${window.location.origin}/client-orders?userId=${sessionStorage.userId}`).then( response => {
            table.innerText = ""


            for(let itemKey in response.data){
                let template = `<tr><td>
                <div class="d-flex px-2">
                <div>
                    <img src="../assets/img/pending.png" class="avatar avatar-sm rounded-circle me-2" alt="spotify">
                    </div>
                    <div class="my-auto">
                        <h6 class="mb-0 text-sm">${response.data[itemKey].status}</h6>
                    </div>
                </div>
                </td>

                <td>
                    <p class="text-sm font-weight-bold mb-0">${response.data[itemKey].fuelType}</p>
                    </td>
                    <td>
                    <span class="text-xs font-weight-bold">${response.data[itemKey].stationName}, ${response.data[itemKey].location}</span>
                </td>

                <td class="align-middle text-center">
                <div class="d-flex align-items-center justify-content-center">
                <span class="me-2 text-xs font-weight-bold">${response.data[itemKey].fuelQuantity} L</span>
                </div>
                </td>
                </tr>`

                table.innerHTML += template
            }
        })   
    }
}

function getNewOrdersDataObjects(){

    function getNewOrdersDataSub(){
        $.get(`${window.location.origin}/cancelled-orders`).then( response => {
            for(let itemKey in response.data){
                if(fuelData[2] === -1){
                    fuelData[2] = 1
                }else{
                    fuelData[2]++
                }
            }
        })   
    }

    let table = document.getElementById("new_orders_table")
    if(table){

        $.get(`${window.location.origin}/new-orders`).then( response => {
            table.innerText = ""


            for(let itemKey in response.data){
                let template = `<tr><td>
                <div class="d-flex px-2">
                <div>
                    <img src="../assets/img/pending.png" class="avatar avatar-sm rounded-circle me-2" alt="spotify">
                    </div>
                    <div class="my-auto">
                        <h6 class="mb-0 text-sm">${response.data[itemKey].status}</h6>
                    </div>
                </div>
                </td>

                <td>
                    <p class="text-sm font-weight-bold mb-0">${response.data[itemKey].fuelType}</p>
                    </td>
                    <td>
                    <span class="text-xs font-weight-bold">${response.data[itemKey].stationName}, ${response.data[itemKey].location}</span>
                </td>

                <td class="align-middle text-center">
                <div class="d-flex align-items-center justify-content-center">
                <span class="me-2 text-xs font-weight-bold">${response.data[itemKey].fuelQuantity} L</span>
                </div>
                </td>
                </tr>`

                table.innerHTML += template
                if(fuelData[0] === -1){
                    fuelData[0] = 1
                }else{
                    fuelData[0]++
                }
            }
        })   
    }else{
        getNewOrdersDataSub()
    }
}



function getProcessedOrdersDataObjects(){

    function  getProcessedOrdersDataObjectsSub(){

        $.get(`${window.location.origin}/processed-orders`).then( response => {

            for(let itemKey in response.data){
                
                if(fuelData[1] === -1){
                    fuelData[1] = 1
                }else{
                    fuelData[1]++
                }

                if(fuelDistributionData[response.data[itemKey].fuelType] === -1){
                    fuelDistributionData[response.data[itemKey].fuelType] = parseInt(response.data[itemKey].fuelQuantity)
                }else{
                    fuelDistributionData[response.data[itemKey].fuelType] += parseInt(response.data[itemKey].fuelQuantity)
                }
            }
        })   
    }

    let table = document.getElementById("processed_orders_table")
  
    if(table){
        table.innerText = ""
        $.get(`${window.location.origin}/processed-orders`).then( response => {
            
            for(let itemKey in response.data){
                let template = `<tr><td>
                <div class="d-flex px-2">
                <div>
                    <img src="../assets/img/processed.png" class="avatar avatar-sm rounded-circle me-2" alt="spotify">
                    </div>
                    <div class="my-auto">
                        <h6 class="mb-0 text-sm">${response.data[itemKey].status}</h6>
                    </div>
                </div>
                </td>

                <td>
                    <p class="text-sm font-weight-bold mb-0">${response.data[itemKey].fuelType}</p>
                    </td>
                    <td>
                    <span class="text-xs font-weight-bold">${response.data[itemKey].stationName}, ${response.data[itemKey].location}</span>
                </td>

                <td class="align-middle text-center">
                <div class="d-flex align-items-center justify-content-center">
                <span class="me-2 text-xs font-weight-bold">${response.data[itemKey].fuelQuantity} L</span>
                </div>
                </td>
                </tr>`

                table.innerHTML += template
             
                if(fuelData[1] === -1){
                    fuelData[1] = 1
                }else{
                    fuelData[1]++
                }

                if(fuelDistributionData[response.data[itemKey].fuelType] === -1){
                    fuelDistributionData[response.data[itemKey].fuelType] = parseInt(response.data[itemKey].fuelQuantity)
                }else{
                    fuelDistributionData[response.data[itemKey].fuelType] += parseInt(response.data[itemKey].fuelQuantity)
                }
            }
        })   
    }else{
        getProcessedOrdersDataObjectsSub()
    }
}

function getCancelledOrdersDataObjects(){

    function getCancelledOrdersSub(){
        $.get(`${window.location.origin}/cancelled-orders`).then( response => {
            for(let itemKey in response.data){
                if(fuelData[2] === -1){
                    fuelData[2] = 1
                }else{
                    fuelData[2]++
                }
            }
        })   
    }

    let table = document.getElementById("cancelled_orders_table")

    if(table){
        table.innerText = ""
        $.get(`${window.location.origin}/cancelled-orders`).then( response => {
            
            for(let itemKey in response.data){
                let template = `
                <tr>
                <td>
                    <div class="d-flex px-2">
                    
                    <div>
                        <img src="../assets/img/cancelled.png" class="avatar avatar-sm rounded-circle me-2" alt="order">
                        </div>
                        <div class="my-auto">
                            <h6 class="mb-0 text-sm">${response.data[itemKey].status}</h6>
                        </div>
                    </div>
                </td>

                <td>
                    <p class="text(-sm font-weight-bold mb-0">${response.data[itemKey].fuelType}</p>
                    </td>
                    <td>
                    <span class="text-xs font-weight-bold">${response.data[itemKey].stationName}, ${response.data[itemKey].location}</span>
                </td>

                <td>
                    <div class="d-flex align-items-center justify-content-center">
                    <span class="me-2 text-xs font-weight-bold">${response.data[itemKey].fuelQuantity} L</span>
                    </div>
                </td>

                <td>
                    <div class="d-flex align-items-center justify-content-center">
                    <span class="me-2 text-xs font-weight-bold">${response.data[itemKey].fuelQuantity} L</span>
                </div>

            </td>
                </tr>`

                table.innerHTML += template
                if(fuelData[2] === -1){
                    fuelData[2] = 1
                }else{
                    fuelData[2]++
                }
            }
        })   
    }else{
        getCancelledOrdersSub()
    }
}




setInterval(getSystemMetrics, 10000)
setInterval(getOrdersValue, 500)

setInterval(getNewOrdersDataObjects, 10000)
setInterval(getClientOrdersDataObjects, 10000)
setInterval(getProcessedOrdersDataObjects, 10000)
setInterval(getCancelledOrdersDataObjects, 10000)


