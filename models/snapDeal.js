const mongoose = require("mongoose");

const snapDealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      require,
    },
    price: { type: String, require },
    image: { type: String, require },
    rating: { type: String, require },
    offerprice: { type: String, require },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("snapdeals", snapDealSchema);
