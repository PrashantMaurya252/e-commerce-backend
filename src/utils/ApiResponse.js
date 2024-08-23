class ApiResponse{
    constructor(statuscode,message="Api called successfully",data){
        this.statuscode = statuscode
        this.data = data
        this.message = message
        this.success = statuscode < 400
    }
}

export {ApiResponse}