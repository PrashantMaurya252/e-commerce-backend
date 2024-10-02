class ApiResponse{
    constructor(statuscode,data,message="Api called successfully"){
        this.status = statuscode
        this.data = data
        this.message = message
        this.success = statuscode < 400
    }
}

export {ApiResponse}