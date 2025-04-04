function readVietnameseNumber(number) {
    const ChuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const DonVi = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ", "tỷ tỷ"];

    if (isNaN(number)) return "";
    if (number === 0) return "Không";

    let so = number.toString();
    let result = "";
    let i = 0;

    while (so.length > 0) {
        let segment = so.slice(-3);
        so = so.slice(0, -3);
        let readSegment = readThreeDigits(segment);

        if (readSegment) {
            result = readSegment + " " + DonVi[i] + " " + result;
        }
        i++;
    }

    return result.trim().replace(/\s+/g, ' ').replace(/^\w/, c => c.toUpperCase());

    function readThreeDigits(numStr) {
        while (numStr.length < 3) numStr = "0" + numStr;
        let [tram, chuc, donvi] = numStr.split("").map(Number);
        let str = "";

        if (tram > 0) {
            str += ChuSo[tram] + " trăm ";
            if (chuc === 0 && donvi > 0) str += "lẻ ";
        }

        if (chuc > 0) {
            if (chuc === 1) str += "mười ";
            else str += ChuSo[chuc] + " mươi ";
        }

        if (donvi > 0) {
            if (chuc !== 0 && donvi === 1) str += "mốt ";
            else if (chuc !== 0 && donvi === 5) str += "lăm ";
            else str += ChuSo[donvi] + " ";
        }

        return str.trim();
    }
}

module.exports = { readVietnameseNumber };
