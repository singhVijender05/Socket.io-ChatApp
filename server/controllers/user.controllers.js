import asyncHandler from "express-async-handler"
import jwt from "jsonwebtoken"
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const genTokens=async function(user){
  try{
    const accessToken= user.generateAccessToken()
    const refreshToken=user.generateRefreshToken()
    // console.log("generated tokens in genTokens ",accessToken," ",refreshToken)
    // console.log("user in genTokens ",user);
    //refresh token db me store karte hai
    user.refreshToken=refreshToken;
    await user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}
  }
  catch(error){
    throw new ApiError(500,error.message)
  }
}
const registerUser=asyncHandler(async (req,res)=>{
  //get user details from frontend
  //validatin -not empty etc.
  //check if user already exists: username,email
  //check for images, check for avatar(required)
  //upload them to cloudinary
  //create user object- create entry in db
  //remove password and refresh toke field from response
  //check for user creation
  //return res

  // console.log(req.body)
  const {email,username,password}=req.body;
//   console.log(res)
  if([email,username,password].some((field)=>field.trim()==="")){
    throw new ApiError(400,"all fields are compulsory")
  }

  //check if user exists
  const existedUser= await User.findOne({
    $or:[{email},{username}]
  })
  if(existedUser){
    throw new ApiError(409,"User with email or username already exists")
  }

  // console.log("request files ",req.files)
  const avatarLocalPath=req.file?.path;
  // console.log("avatar local path: ,"+avatarLocalPath);
  

  //upload on cloudinary
 const avatar=await uploadOnCloudinary(avatarLocalPath)
  //upload on db
  const user= await User.create({
    avatar:avatar?.url || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    email,
    password,
    username:username.toLowerCase()
  })

  const createdUser= await User.findById(user._id).select(
    "-password -refreshtoken"
  )
  if(!createdUser){
    throw new ApiError(501,"server error ")
  }

  return res.status(201).json(
     new ApiResponse(200,createdUser,"user registered successfully")
  )
})

const loginUser=asyncHandler(async (req,res)=>{
  //username or email
  //find user
  //password
  //if matches , send access and refresh token
  //send through secure cookies

  const {email,password}=req.body;
  // console.log("credentials received in login ",email," ",password)
  if(!email){
    throw new ApiError(400,"email required")
  }

  //find user
  const existsUser=await User.findOne({email})
  // console.log("existing user in login ",existsUser)
  if(!existsUser) throw new ApiError(404,"User does not exist")

  const passwordMatch= await existsUser.isCorrectPassword(password);
  
  if(!passwordMatch){
    throw new ApiError(401,"Password Incorrect");
  }

  const {accessToken,refreshToken}=await genTokens(existsUser)

  const modifiedUser=await User.findById(existsUser._id).select("-password -refreshToken")
  //send token through secure cookies
  const options={
    httpOnly:true, //only modifiable from server now
    secure:true
  }
  return res.status(200).
  cookie("accessToken",accessToken,options).
  cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        user: modifiedUser,refreshToken,accessToken
      },
      "user logged in successfully"
    )
  )

})

const logoutUser=asyncHandler(async(req,res)=>{
 await User.findByIdAndUpdate(req.user._id,
    {
    $set:{
      refreshToken: undefined
    }
  },
    {
      new: true
    }
  )
  const options={
    httpOnly:true,
    secure:true
  }
  return res.
  status(200).
  clearCookie("accessToken",options).
  clearCookie("refreshToken",options).
  json(new ApiResponse(200,{},"user logged out"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
  const receivedRefreshToken=req.cookies.refreshToken || req.body.refreshToken
  if(!receivedRefreshToken) throw ApiError(401,"Unauthorized request")

  // console.log("refresh token ",receivedRefreshToken)
  try {
    const decodedtoken=jwt.verify(receivedRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
    // console.log("decoded token ",decodedtoken)
    const user=await User.findById(decodedtoken?._id)
    // console.log(user)
    if(!user) {
      throw new ApiError(401,"Invalid Refresh Token")
    }
  
    if(user.refreshToken !==receivedRefreshToken){
      throw ApiError(401,"Refresh Token expired or used")
    }
    const options={
      httpOnly:true,
      secure:true
    }
  
    const tokens=await genTokens(user);
  
    // console.log(tokens)
    res.status(200)
    .cookie("accessToken",tokens.accessToken,options)
    .cookie("refreshToken",tokens.refreshToken,options)
    .json(
      new ApiResponse(
        200,
        "token refreshed successfully",
        {accessToken:tokens.accessToken,refreshToken:tokens.refreshToken},
      )
    )
  } catch (error) {
    throw new ApiError(401,error.message)
  }
})

const updateAvatar=asyncHandler(async(req,res)=>{
  const avatarLocalPath=req.file?.path;
  if(!avatarLocalPath){
    throw new ApiError(409,"avatar file required")
  }
  const avatar=await uploadOnCloudinary(avatarLocalPath)
  const user=await User.findByIdAndUpdate(req.user._id,{
    avatar:avatar.url
  },{new:true}).select("-password -refreshToken")
  if(!user){
    throw new ApiError(501,"server error")
  }
  return res.status(200).
  json(new ApiResponse(200,user,"avatar updated successfully"))
})


const changeCurrentUserPassword=asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body;
  if(!oldPassword || !newPassword){
    throw new ApiError(400,"old and new password required")
  }
  const user=await User.findById(req.user._id)
  if(!user){
    throw new ApiError(404,"User not found")
  }
  const passwordMatch=await user.isCorrectPassword(oldPassword)
  if(!passwordMatch){
    throw new ApiError(401,"Password Incorrect")
  }
  user.password=newPassword;
  await user.save({validateBeforeSave:false})

  return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"))

})

const findCurrentUser=asyncHandler(async(req,res)=>{
  const user=await User.findById(req.user._id).select("-password -refreshToken")
  if(!user){
    throw new ApiError(404,"User not found")
  }
  return res.status(200).json(new ApiResponse(200,user,"User found successfully"))
})

const updateDetails=asyncHandler(async(req,res)=>{
  const {fullname,email,username}=req.body;
  if([fullname,email,username].some((field)=>field.trim()==="")){
    throw new ApiError(400,"all fields are compulsory")
  }
  const user=await User.findByIdAndUpdate(req.user._id,{
    fullname:fullname,
    email:email,
    username:username
  },{new:true}).select("-password -refreshToken")
  if(!user){
    throw new ApiError(501,"server error")
  }
  return res.status(200).json(new ApiResponse(200,user,"User updated successfully"))
})
export {registerUser,loginUser,logoutUser,refreshAccessToken,updateAvatar,changeCurrentUserPassword,findCurrentUser,updateDetails}