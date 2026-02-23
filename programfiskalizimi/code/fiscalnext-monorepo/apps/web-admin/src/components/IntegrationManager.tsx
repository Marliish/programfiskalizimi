// Integration Manager Component
import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Modal, Form, Input, Select, Switch, Tabs, Alert } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { TabPane } = Tabs;
const { Option } = Select;

interface Integration {
  id: string;
  name: string;
  provider: string;
  type: string;
  enabled: boolean;
  lastSync?: Date;
}

export const IntegrationManager: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [form] = Form.useForm();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/v1';

  // Fetch integrations
  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/integrations`);
      setIntegrations(response.data);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  // Test connection
  const testConnection = async (id: string) => {
    try {
      const response = await axios.post(`${API_URL}/integrations/${id}/test`);
      if (response.data.success) {
        Modal.success({
          title: 'Connection Successful',
          content: response.data.message,
        });
      } else {
        Modal.error({
          title: 'Connection Failed',
          content: response.data.message,
        });
      }
    } catch (error: any) {
      Modal.error({
        title: 'Connection Error',
        content: error.message,
      });
    }
  };

  // Sync integration
  const syncIntegration = async (integration: Integration) => {
    try {
      let endpoint = '';
      
      switch (integration.provider) {
        case 'shopify':
          endpoint = `/integrations/${integration.id}/shopify/sync-products`;
          break;
        case 'woocommerce':
          endpoint = `/integrations/${integration.id}/woocommerce/sync-products`;
          break;
        default:
          Modal.info({ content: 'Sync not available for this integration' });
          return;
      }

      const response = await axios.post(`${API_URL}${endpoint}`);
      Modal.success({
        title: 'Sync Complete',
        content: `Imported ${response.data.imported} items`,
      });
      fetchIntegrations();
    } catch (error: any) {
      Modal.error({
        title: 'Sync Failed',
        content: error.message,
      });
    }
  };

  // Delete integration
  const deleteIntegration = async (id: string) => {
    Modal.confirm({
      title: 'Delete Integration',
      content: 'Are you sure you want to delete this integration?',
      onOk: async () => {
        try {
          await axios.delete(`${API_URL}/integrations/${id}`);
          fetchIntegrations();
          Modal.success({ content: 'Integration deleted successfully' });
        } catch (error: any) {
          Modal.error({ content: error.message });
        }
      },
    });
  };

  // Save integration
  const saveIntegration = async (values: any) => {
    try {
      if (selectedIntegration) {
        await axios.put(`${API_URL}/integrations/${selectedIntegration.id}`, values);
      } else {
        await axios.post(`${API_URL}/integrations`, values);
      }
      setModalVisible(false);
      form.resetFields();
      setSelectedIntegration(null);
      fetchIntegrations();
      Modal.success({ content: 'Integration saved successfully' });
    } catch (error: any) {
      Modal.error({ content: error.message });
    }
  };

  // Open form modal
  const openModal = (integration?: Integration) => {
    if (integration) {
      setSelectedIntegration(integration);
      form.setFieldsValue(integration);
    } else {
      setSelectedIntegration(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      shopify: '🛍️',
      woocommerce: '🛒',
      amazon: '📦',
      dhl: '🚚',
      fedex: '📬',
      ups: '📮',
      hubspot: '🎯',
      salesforce: '☁️',
      slack: '💬',
      twilio: '📱',
      google: '🔍',
    };
    return icons[provider] || '🔌';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ecommerce: 'blue',
      marketplace: 'purple',
      shipping: 'orange',
      crm: 'green',
      business: 'cyan',
      custom: 'default',
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: 'Integration',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Integration) => (
        <div>
          <span style={{ marginRight: 8, fontSize: 20 }}>
            {getProviderIcon(record.provider)}
          </span>
          <strong>{text}</strong>
          <div style={{ fontSize: 12, color: '#888' }}>
            {record.provider}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Badge color={getTypeColor(type)} text={type} />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Badge
          status={enabled ? 'success' : 'default'}
          text={enabled ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      title: 'Last Sync',
      dataIndex: 'lastSync',
      key: 'lastSync',
      render: (date: Date) => date ? new Date(date).toLocaleString() : 'Never',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Integration) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => testConnection(record.id)}
          >
            Test
          </Button>
          <Button
            size="small"
            icon={<SyncOutlined />}
            onClick={() => syncIntegration(record)}
          >
            Sync
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteIntegration(record.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ApiOutlined />
            <span>Integrations</span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            Add Integration
          </Button>
        }
      >
        <Alert
          message="Connect FiscalNext with your favorite platforms"
          description="Sync products, orders, customers, and automate workflows across your entire ecosystem."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Tabs defaultActiveKey="all">
          <TabPane tab="All Integrations" key="all">
            <Table
              columns={columns}
              dataSource={integrations}
              loading={loading}
              rowKey="id"
            />
          </TabPane>
          <TabPane tab="E-Commerce" key="ecommerce">
            <Table
              columns={columns}
              dataSource={integrations.filter(i => i.type === 'ecommerce')}
              loading={loading}
              rowKey="id"
            />
          </TabPane>
          <TabPane tab="Shipping" key="shipping">
            <Table
              columns={columns}
              dataSource={integrations.filter(i => i.type === 'shipping')}
              loading={loading}
              rowKey="id"
            />
          </TabPane>
          <TabPane tab="CRM" key="crm">
            <Table
              columns={columns}
              dataSource={integrations.filter(i => i.type === 'crm')}
              loading={loading}
              rowKey="id"
            />
          </TabPane>
          <TabPane tab="Business Tools" key="business">
            <Table
              columns={columns}
              dataSource={integrations.filter(i => i.type === 'business')}
              loading={loading}
              rowKey="id"
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={selectedIntegration ? 'Edit Integration' : 'Add Integration'}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSelectedIntegration(null);
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={saveIntegration}
        >
          <Form.Item
            name="name"
            label="Integration Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="My Shopify Store" />
          </Form.Item>

          <Form.Item
            name="provider"
            label="Provider"
            rules={[{ required: true, message: 'Please select a provider' }]}
          >
            <Select placeholder="Select provider">
              <Option value="shopify">Shopify</Option>
              <Option value="woocommerce">WooCommerce</Option>
              <Option value="amazon">Amazon</Option>
              <Option value="ebay">eBay</Option>
              <Option value="dhl">DHL</Option>
              <Option value="fedex">FedEx</Option>
              <Option value="ups">UPS</Option>
              <Option value="hubspot">HubSpot</Option>
              <Option value="salesforce">Salesforce</Option>
              <Option value="slack">Slack</Option>
              <Option value="twilio">Twilio</Option>
              <Option value="google">Google Workspace</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select a type' }]}
          >
            <Select placeholder="Select type">
              <Option value="ecommerce">E-Commerce</Option>
              <Option value="marketplace">Marketplace</Option>
              <Option value="shipping">Shipping</Option>
              <Option value="crm">CRM</Option>
              <Option value="business">Business Tools</Option>
              <Option value="custom">Custom</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="enabled"
            label="Status"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item
            name={['config', 'apiKey']}
            label="API Key"
          >
            <Input.Password placeholder="Enter API key" />
          </Form.Item>

          <Form.Item
            name={['config', 'apiUrl']}
            label="API URL"
          >
            <Input placeholder="https://api.example.com" />
          </Form.Item>

          <Form.Item
            name="syncInterval"
            label="Sync Interval (minutes)"
          >
            <Input type="number" placeholder="30" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IntegrationManager;
