class myProfile{
    constructor(
        profile,
        name="Prashant Maurya",
        age
    )
    {
        
        this.name = name
        this.profile = profile
        this.age = age
        this.isAdult = age > 18
    }
}

class me extends myProfile{
    constructor(name,skills="Frontend"){
        super(name)
        this.name = name
        this.skills= skills
    }
}
const profile = new myProfile("Software Developer","Kumar",20)
const myself = new me("Shantanu")

console.log(myself)

console.log(profile)