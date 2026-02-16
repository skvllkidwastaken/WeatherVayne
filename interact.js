document.addEventListener('DOMContentLoaded', () => {
	// Timezone dropdown for the time widget
	const timeWidget = document.querySelector('.time-widget');
	const timeEl = document.getElementById('time');
	if (timeWidget && timeEl) {
		const select = document.createElement('select');
		select.id = 'tz-select';
		select.title = 'Select timezone';

		const zones = [
			{ label: 'Auto (local)', value: 'auto' },
			{ label: 'UTC', value: 'UTC' },
			{ label: 'New York (America/New_York)', value: 'America/New_York' },
			{ label: 'Chicago (America/Chicago)', value: 'America/Chicago' },
			{ label: 'Los Angeles (America/Los_Angeles)', value: 'America/Los_Angeles' },
			{ label: 'London (Europe/London)', value: 'Europe/London' },
			{ label: 'Paris (Europe/Paris)', value: 'Europe/Paris' },
			{ label: 'Tokyo (Asia/Tokyo)', value: 'Asia/Tokyo' },
			{ label: 'Sydney (Australia/Sydney)', value: 'Australia/Sydney' }
		];

		zones.forEach(z => {
			const opt = document.createElement('option');
			opt.value = z.value;
			opt.textContent = z.label;
			select.appendChild(opt);
		});

		// load saved timezone
		const savedTz = localStorage.getItem('weather-tz') || 'auto';
		select.value = savedTz;
		timeEl.dataset.timezone = savedTz;

		select.addEventListener('change', (e) => {
			const tz = e.target.value || 'auto';
			timeEl.dataset.timezone = tz;
			localStorage.setItem('weather-tz', tz);
		});

		// insert the select into the widget below the time display
		if (timeEl.nextSibling) timeWidget.insertBefore(select, timeEl.nextSibling);
		else timeWidget.appendChild(select);
	}

	// Draggable widgets with position persistence (localStorage)
	const widgets = document.querySelectorAll('.widget');
	widgets.forEach(widget => {
		const id = widget.className.split(' ').join('-');
		const key = `widget-pos-${id}`;

		// apply saved position
		try {
			const raw = localStorage.getItem(key);
			if (raw) {
				const pos = JSON.parse(raw);
				widget.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
				widget.__pos = { x: pos.x, y: pos.y };
			} else {
				widget.__pos = { x: 0, y: 0 };
			}
		} catch (e) {
			widget.__pos = { x: 0, y: 0 };
		}

		let dragging = false;
		let startX = 0, startY = 0;
		let startOffset = { x: 0, y: 0 };

		function isInteractiveTarget(el) {
			const tag = el.tagName && el.tagName.toLowerCase();
			return ['input', 'select', 'button', 'a', 'textarea', 'iframe', 'label'].includes(tag);
		}

		widget.addEventListener('pointerdown', (ev) => {
			if (isInteractiveTarget(ev.target)) return;
			widget.setPointerCapture(ev.pointerId);
			dragging = true;
			widget.classList.add('dragging');
			startX = ev.clientX;
			startY = ev.clientY;
			startOffset = { x: widget.__pos.x || 0, y: widget.__pos.y || 0 };
			ev.preventDefault();
		});

		window.addEventListener('pointermove', (ev) => {
			if (!dragging) return;
			const dx = ev.clientX - startX;
			const dy = ev.clientY - startY;
			const nx = Math.round(startOffset.x + dx);
			const ny = Math.round(startOffset.y + dy);
			widget.__pos = { x: nx, y: ny };
			widget.style.transform = `translate(${nx}px, ${ny}px)`;
		});

		window.addEventListener('pointerup', (ev) => {
			if (!dragging) return;
			dragging = false;
			widget.classList.remove('dragging');
			try { widget.releasePointerCapture && widget.releasePointerCapture(ev.pointerId); } catch (e) {}
			// save
			localStorage.setItem(key, JSON.stringify(widget.__pos));
		});
	});
});
