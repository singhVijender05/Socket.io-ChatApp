class ApiResponse{
    constructor(statusCode, message, data=null, success=true, errors=[]){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = success < 400;
        this.errors = errors;
    }
}
export default ApiResponse;