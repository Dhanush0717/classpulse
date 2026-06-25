const generateClassCode = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CP${random}`;
};

module.exports = generateClassCode;