 const asyncHandler=(requestHandler)=>{
   return (req , res, next)=>{
    Promise.resolve(requestHandler(req , res , next)).catch((err)=> next(err))
   }

 }
 export {asyncHandler}


 ////////////////////////////////


//  using async await ------------->

//  const asyncHandler =(requestHandler)=> async()=>{
//     try {
//     await requestHandler (req , res , next)
        
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success:false,
//             message:err.message
//         })
        
//     }
//  }