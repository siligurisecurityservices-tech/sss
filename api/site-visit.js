const { handleLead } = require("./_lib/lead.js");

module.exports = async function (req, res) {
  return handleLead(req, res, { kind: "site-visit", requireLocation: true });
};
