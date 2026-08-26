import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConfigurableDocumentHeader } from './ConfigurableDocumentHeader';

describe('ConfigurableDocumentHeader', () => {
  it('renders uploaded assets and follows the configured item order', () => {
    const { container } = render(
      <ConfigurableDocumentHeader
        settings={{
          order: ['right-photo', 'clinic-info-logo', 'left-image'],
          clinicName: 'Configured Dental Clinic',
          address: 'Configured Address',
          contact: '0912 000 0000',
          middleImageData: 'data:image/png;base64,bWlkZGxl',
          showMiddleImage: true,
          leftImageData: 'data:image/png;base64,bGVmdA==',
          rightImageData: 'data:image/png;base64,cmlnaHQ='
        }}
      />
    );

    const items = Array.from(
      container.querySelectorAll<HTMLElement>('[data-header-item]')
    ).map((item) => item.dataset.headerItem);

    expect(items).toEqual(['right-photo', 'clinic-info-logo', 'left-image']);
    expect(screen.getByText('Configured Dental Clinic')).toBeInTheDocument();
    expect(screen.getByAltText('Clinic brand logo')).toBeInTheDocument();
    expect(screen.getByAltText('Clinic left logo')).toBeInTheDocument();
    expect(screen.getByAltText('Patient 2x2')).toBeInTheDocument();
  });

  it('honors identity and image visibility settings', () => {
    render(
      <ConfigurableDocumentHeader
        settings={{
          showClinicName: false,
          showAddress: false,
          showContact: false,
          showLeftImage: false,
          showRightImage: false
        }}
      />
    );

    expect(screen.queryByText('P & J TANARTE')).not.toBeInTheDocument();
    expect(screen.queryByText('2x2 Photo')).not.toBeInTheDocument();
  });
});
