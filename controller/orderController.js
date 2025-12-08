import Order from "../models/order.js";

export async function createOrder(req, res) {
    console.log("REQ.USER = ", req.user);

    /*if(req.user == null){

        res.status(401).json(
            {
                message : "Unauthenticated user"
            }
    )
        return
    }*/

    try{

        const user = req.user
        if(user == null){
            res.status(401).json(
                {
                    message: "Unauthorozed user"
                }
            )
            return
        }
        const orderList  = await Order.find().sort({date: -1}).limit(1);

        let newOrderID = "CBC0000001"

        if(orderList.length != 0){
            let lastOrderIDInString = orderList[0].orderID;
            let lastOrderIDNumberInString = lastOrderIDInString.replace("CBC", "");
            let lastOrderNumber = parseInt(lastOrderIDNumberInString);
            let newOrderNumber = lastOrderNumber + 1;

            let newOrderIDNumberInString = newOrderNumber.toString().padStart(7, '0');
            newOrderID = "CBC" + newOrderIDNumberInString;

        }

        let customerName = req.body.customerName;
        if(customerName == null){
            customerName = user.firstName + " " + user.lastName
        }

        let phone = req.body.phone;
        if(phone == null){
            phone = "Not provided"
        }

        const itemsInRequest = req.body.items; 
        if(itemsInRequest == null){
            res.status(400).json(
                {
                    message : "Items are required to place an order"
                }
            )
            return
        }
        if(!Array.isArray(itemsInRequest)){
            res.status(400).json(
                {
                    message : "Items should be an array"
                }
            )
            return
        }

        const itemsToBeAdded = []
        let total = 0

        for(let i=0; i<itemsInRequest.length; i++){
            const item = itemsInRequest[i];
            
            const product = await Product.findOne({productID : item.productID})

            if(product == null){
                res.status(400).json(
                    {
                        code : "not found",
                        message : `Product with ID ${item.productID} not found`,
                        productID : item.productID
                    }
                )
                return  
            }
            if(product.stock < item.quantity){
                res.status(400).json(
                    {
                        code : "stock",
                        message : `Insufficient stock for product ID ${item.productID}`,
                        productID : item.productID, 
                        availableStock : product.stock
                    }
                )
                return
            }
            
            itemsToBeAdded.push({
                productID : product.productID,
                quantity : item.quantity,
                name : product.name,
                price : product.price,
                image : product.image[0]
            })
            total += product.price * item.quantity
        }


        const newOrder = new Order({
            orderID : newOrderID,
            items : itemsToBeAdded,
            customerName : customerName,
            email : user.email,
            phone : phone,
            address : req.body.address,
            total : total
            
        });
        const savedOrder = await newOrder.save()

       /* for(let i=0; i<itemsToBeAdded.length; i++){
            const item = itemsToBeAdded[i];
            await Product.updateOne(
                { productID : item.productID },
                { $inc: { stock: -item.quantity } }
            )
        }*/

        res.status(201).json(
            {
                message : "Order created successfully",
                order : savedOrder
            }
        )

    }catch(err){
        console.log(err);
        res.status(500).json(
            {
                message : "Internal server error"
            }
        )

    }


}

export async function getOrders(req, res) {

    if(isAdmin(req)){
        const orders = await Order.find().sort({date : -1})
        res.json(orders)
    }else if(isCustomer(req)){
        const user = req.user
        const orders = await Order.find({ email : user.email }).sort({date : -1})
        res.json(orders)
    }else{
        res.status(403).json(
            {
                message : "You are not authorized to view the orders"
            }
        )
    }
}