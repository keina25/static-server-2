const fs = require('fs')

//读数据库
const usersString = fs.readFileSync('./db/users.json').toString()
const usersArray = JSON.parse(usersString)  //JSON.parse可以把字符串变成对应的数组，对象或者其他东西
//console.log(typeof usersString)
//console.log(usersString)
//console.log(typeof usersArray)
//console.log(usersArray instanceof Array) //如果是true，那就是数组
//console.log(usersArray)

//写数据库
const user3 = {id:3,name:'tome',password:'yyy'}
usersArray.push(user3)   //把第三个用户放到这个数组里面
//存数据库
const string = JSON.stringify(usersArray) //可以把js对象变成字符串
fs.writeFileSync('./db/users.json',string)