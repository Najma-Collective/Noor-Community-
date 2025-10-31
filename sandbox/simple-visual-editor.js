/**
 * Simple Visual Editor Integration for Sandbox
 * Makes slides directly editable without forms
 */

/**
 * Make a slide visually editable
 */
export function makeSlideVisuallyEditable(slideElement) {
  if (!slideElement) return;

  // Make all text editable
  const textElements = slideElement.querySelectorAll(
    '[data-field], .slide-title, .slide-subtitle, h1, h2, h3, h4, p:not(.builder-hint), li'
  );

  textElements.forEach((el) => {
    // Skip if already editable or is a button/input
    if (
      el.hasAttribute('contenteditable') ||
      el.tagName === 'BUTTON' ||
      el.tagName === 'INPUT' ||
      el.closest('button')
    ) {
      return;
    }

    el.setAttribute('contenteditable', 'true');
    el.style.cursor = 'text';
    el.style.outline = 'none';

    // Add visual feedback on focus
    el.addEventListener('focus', () => {
      el.style.outline = '2px solid #3b82f6';
      el.style.outlineOffset = '2px';
    });

    el.addEventListener('blur', () => {
      el.style.outline = 'none';
    });

    // Add hover effect
    el.addEventListener('mouseenter', () => {
      if (document.activeElement !== el) {
        el.style.outline = '1px dashed #94a3b8';
        el.style.outlineOffset = '2px';
      }
    });

    el.addEventListener('mouseleave', () => {
      if (document.activeElement !== el) {
        el.style.outline = 'none';
      }
    });
  });

  // Make icons clickable (show instructions)
  const icons = slideElement.querySelectorAll('i[class*="fa-"]');
  icons.forEach((icon) => {
    icon.style.cursor = 'pointer';
    icon.title = 'Click to change icon (open Font Awesome library and copy class names)';

    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentClass = icon.className;
      const newClass = prompt(
        'Enter Font Awesome icon class (e.g., fa-solid fa-heart):\n\nVisit https://fontawesome.com/icons to browse',
        currentClass
      );

      if (newClass && newClass.trim() && newClass !== currentClass) {
        icon.className = newClass.trim();
      }
    });

    icon.addEventListener('mouseenter', () => {
      icon.style.outline = '2px dashed #3b82f6';
      icon.style.outlineOffset = '4px';
    });

    icon.addEventListener('mouseleave', () => {
      icon.style.outline = 'none';
    });
  });

  // Add list item controls
  const lists = slideElement.querySelectorAll('ul, ol');
  lists.forEach((list) => {
    // Add "+" button after list
    if (!list.nextElementSibling?.classList.contains('add-list-item-btn')) {
      const addBtn = document.createElement('button');
      addBtn.className = 'add-list-item-btn';
      addBtn.type = 'button';
      addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add item';
      addBtn.style.cssText = `
        margin-top: 8px;
        padding: 8px 16px;
        background: white;
        border: 1px dashed #cbd5e1;
        border-radius: 6px;
        color: #64748b;
        font-size: 14px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      `;

      addBtn.addEventListener('mouseenter', () => {
        addBtn.style.background = '#f8fafc';
        addBtn.style.borderColor = '#94a3b8';
        addBtn.style.color = '#475569';
      });

      addBtn.addEventListener('mouseleave', () => {
        addBtn.style.background = 'white';
        addBtn.style.borderColor = '#cbd5e1';
        addBtn.style.color = '#64748b';
      });

      addBtn.addEventListener('click', () => {
        const li = document.createElement('li');
        li.setAttribute('contenteditable', 'true');
        li.textContent = 'New item';
        li.style.cursor = 'text';

        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-list-item-btn';
        deleteBtn.type = 'button';
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteBtn.style.cssText = `
          margin-left: 8px;
          padding: 4px 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          color: #ef4444;
          font-size: 12px;
          cursor: pointer;
        `;
        deleteBtn.addEventListener('click', () => {
          li.remove();
        });

        li.appendChild(deleteBtn);
        list.appendChild(li);
        li.focus();

        // Select the text
        const range = document.createRange();
        range.selectNodeContents(li);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });

      list.after(addBtn);
    }

    // Add delete buttons to existing items
    list.querySelectorAll('li').forEach((li) => {
      if (!li.querySelector('.delete-list-item-btn')) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-list-item-btn';
        deleteBtn.type = 'button';
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteBtn.style.cssText = `
          margin-left: 8px;
          padding: 4px 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          color: #ef4444;
          font-size: 12px;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        `;

        deleteBtn.addEventListener('click', () => {
          li.remove();
        });

        li.addEventListener('mouseenter', () => {
          deleteBtn.style.opacity = '1';
        });

        li.addEventListener('mouseleave', () => {
          deleteBtn.style.opacity = '0';
        });

        li.appendChild(deleteBtn);
      }
    });
  });

  // Show notification
  showEditingNotification(slideElement);
}

/**
 * Show notification that slide is editable
 */
function showEditingNotification(slideElement) {
  const notification = document.createElement('div');
  notification.className = 'slide-editing-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 80px;
      right: 20px;
      background: #3b82f6;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-width: 350px;
      animation: slideIn 0.3s ease;
    ">
      <div style="display: flex; align-items: start; gap: 12px;">
        <i class="fa-solid fa-pen-to-square" style="font-size: 20px; margin-top: 2px;"></i>
        <div>
          <strong style="display: block; margin-bottom: 4px;">Slide is now editable!</strong>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
            <li>Click any text to edit</li>
            <li>Click icons to change them</li>
            <li>Use +/- buttons on lists</li>
          </ul>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          margin-left: auto;
        ">×</button>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

/**
 * Initialize visual editing for all slides on the page
 */
export function initVisualEditing() {
  // Make all existing slides editable
  const slides = document.querySelectorAll('.slide-stage');
  slides.forEach((slide) => {
    makeSlideVisuallyEditable(slide);
  });

  // Watch for new slides being added
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          // Element node
          if (node.classList && node.classList.contains('slide-stage')) {
            makeSlideVisuallyEditable(node);
          }

          // Check children
          const childSlides = node.querySelectorAll && node.querySelectorAll('.slide-stage');
          if (childSlides) {
            childSlides.forEach((slide) => {
              makeSlideVisuallyEditable(slide);
            });
          }
        }
      });
    });
  });

  // Start observing
  const viewport = document.querySelector('.stage-viewport');
  if (viewport) {
    observer.observe(viewport, {
      childList: true,
      subtree: true,
    });
  }

  console.log('✅ Visual editing initialized - all slides are now editable');
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .add-list-item-btn:hover {
    transform: translateY(-1px);
  }

  .delete-list-item-btn:hover {
    background: #fef2f2 !important;
    border-color: #fca5a5 !important;
  }

  [contenteditable="true"]:focus {
    background: rgba(59, 130, 246, 0.05);
  }
`;
document.head.appendChild(style);
