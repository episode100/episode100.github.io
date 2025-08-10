(function (){
  async function loadData(){
    const res = await fetch('data.json', {cache:'no-store'});
    return await res.json();
  }
  function el(tag, cls){ const n = document.createElement(tag); if(cls) n.className = cls; return n; }
  function text(n, s){ n.textContent = s; return n; }

  loadData().then(data => {
    // Hero
    document.getElementById('name').textContent = data.name + '.';
    document.getElementById('title').textContent = data.title;
    document.getElementById('aboutText').textContent = data.about;
    document.getElementById('year').textContent = new Date().getFullYear();

    // Skills
    const skillGrid = document.getElementById('skillsGrid');
    data.skills.forEach(s => {
      const card = el('div','skill');
      const img = el('img'); img.src = s.icon; img.alt = s.label + ' icon';
      const label = el('span'); label.textContent = s.label;
      card.append(img,label);
      skillGrid.append(card);
    });

    // Projects
    const projGrid = document.getElementById('projectsGrid');
    data.projects.forEach(p => {
      const card = el('article','card');
      const img = el('img'); img.src = p.thumb; img.alt = p.name + ' thumbnail';
      const content = el('div','content');
      const h3 = el('h3'); h3.textContent = p.name;
      const desc = el('p'); desc.textContent = p.desc;

      const stack = el('div','stack');
      (p.stack||[]).forEach(t => {
        const b = el('span','badge'); b.textContent = t; stack.append(b);
      });

      const links = el('div','links');
      if(p.repo){ const a = el('a','btn'); a.href = p.repo; a.target='_blank'; a.rel='noopener'; a.textContent='Repo'; links.append(a); }
      if(p.live){ const a = el('a','btn'); a.href = p.live; a.target='_blank'; a.rel='noopener'; a.textContent='Live'; links.append(a); }

      content.append(h3, desc, stack);
      card.append(img, content, links);
      projGrid.append(card);
    });

    // Contact
    const contact = document.getElementById('contactBox');
    const em = el('div'); em.innerHTML = `<strong>Mail:</strong> <a href="mailto:${data.contact.email}">${data.contact.email}</a>`;
    const ph = el('div'); ph.innerHTML = `<strong>Mobile:</strong> <a href="tel:${data.contact.phone.replace(/[^+\d]/g,'')}">${data.contact.phone}</a>`;
    const ad = el('div'); ad.innerHTML = `<strong>Address:</strong> ${data.contact.address}`;
    contact.append(em, ph, ad);

    const links = el('div'); links.style.marginTop = '10px';
    (data.contact.links||[]).forEach(l => {
      const a = el('a'); a.href = l.href; a.target='_blank'; a.rel='noopener'; a.textContent = l.label + ' ';
      links.append(a);
    });
    contact.append(links);
  });
})();