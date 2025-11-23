export async function createOrder(req, res) {

    if(req.user == null){
        res.status(401).json(
            {
                message : "Unauthenticated user"
            }
    )
        return
    }

    try{
        const orderList  = await order.find().sort({date: -1}).limit(1);

        let orderID = "CBC0000001"

        if(orderList.length == 0){

        }
        const recentorder = orderList[0];

    }catch(err){
        res.status(500).json(
            {
                message : "Internal server error"
            }
        )

    }


}