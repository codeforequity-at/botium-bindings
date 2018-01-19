const slugifyStripRe = /[^\w\s-]/g
const slugifyHyphenateRe = /[-\s]+/g

function slugify (s) {
  s = s.replace(slugifyStripRe, '').trim().toLowerCase()
  s = s.replace(slugifyHyphenateRe, '-')
  return s
}

module.exports = slugify
