const getDate = async () => {
    return new Date()
}
const printDate = async () => {
    const date = await getDate()
    return date
}
printDate().then(console.log).catch(console.error)